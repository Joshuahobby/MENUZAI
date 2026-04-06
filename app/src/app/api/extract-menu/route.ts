import { EXTRACTION_PROMPT, parseExtractionResponse } from "@/lib/ai-extract";
import { headers } from "next/headers";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// --- Simple in-memory rate limiter: 5 requests per IP per 60 seconds ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: Request) {
  // Rate limiting
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: "Too many requests. Please wait a minute before trying again." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const type = file.type.toLowerCase();
  if (type === "application/pdf") {
    return Response.json(
      { error: "PDF is not supported by the free model. Please upload an image (JPG, PNG, WebP, GIF)." },
      { status: 400 }
    );
  }

  let mediaType: string;
  if (type === "image/jpeg" || type === "image/jpg") mediaType = "image/jpeg";
  else if (type === "image/png") mediaType = "image/png";
  else if (type === "image/webp") mediaType = "image/webp";
  else if (type === "image/gif") mediaType = "image/gif";
  else {
    return Response.json({ error: "Unsupported file type. Use JPG, PNG, WebP, or GIF." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://menuzai.com",
        "X-Title": "MENUZAI",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "google/gemma-3-27b-it:free",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mediaType};base64,${base64}` },
              },
              { type: "text", text: EXTRACTION_PROMPT },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { error?: { message?: string } }).error?.message ?? `OpenRouter error ${response.status}`);
    }

    const data = await response.json() as { choices: { message: { content: string } }[] };
    const responseText = data.choices[0]?.message?.content ?? "";

    const result = parseExtractionResponse(responseText);
    return Response.json(result);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "AI extraction failed";
    console.error("Extract menu error:", errorMessage);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
