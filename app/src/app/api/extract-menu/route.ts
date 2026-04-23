import { EXTRACTION_PROMPT, parseExtractionResponse, mergeExtractionResults, type ExtractionResult } from "@/lib/ai-extract";
import { headers } from "next/headers";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;

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

const MEDIA_TYPES: Record<string, string> = {
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
  "image/gif": "image/gif",
};

async function extractFromFile(file: File, apiKey: string): Promise<ExtractionResult> {
  const type = file.type.toLowerCase();
  const mediaType = MEDIA_TYPES[type];
  if (!mediaType) throw new Error(`Unsupported file type: ${file.type}`);

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://menuzaai.com",
      "X-Title": "MENUZAI",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? "google/gemini-flash-1.5-8b:free",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}` } },
          { type: "text", text: EXTRACTION_PROMPT },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `OpenRouter error ${response.status}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  return parseExtractionResponse(data.choices[0]?.message?.content ?? "");
}

export async function POST(request: Request) {
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

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  // Collect files: supports single "file" key or indexed "file_0", "file_1", ...
  const files: File[] = [];
  const single = formData.get("file");
  if (single instanceof File) {
    files.push(single);
  } else {
    for (let i = 0; i < MAX_FILES; i++) {
      const f = formData.get(`file_${i}`);
      if (f instanceof File) files.push(f);
    }
  }

  if (files.length === 0) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (files.length > MAX_FILES) {
    return Response.json({ error: `Maximum ${MAX_FILES} images allowed` }, { status: 400 });
  }

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: `File "${file.name}" exceeds 10MB limit` }, { status: 400 });
    }
    if (file.type === "application/pdf") {
      return Response.json(
        { error: "PDF is not supported by the free model. Please upload an image (JPG, PNG, WebP, GIF)." },
        { status: 400 }
      );
    }
    if (!MEDIA_TYPES[file.type.toLowerCase()]) {
      return Response.json({ error: `Unsupported file type: ${file.type}. Use JPG, PNG, WebP, or GIF.` }, { status: 400 });
    }
  }

  try {
    const results = await Promise.all(files.map(f => extractFromFile(f, apiKey)));
    const merged = mergeExtractionResults(results);
    return Response.json(merged);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "AI extraction failed";
    console.error("Extract menu error:", errorMessage);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
