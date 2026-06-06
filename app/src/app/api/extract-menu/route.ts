import { EXTRACTION_PROMPT, parseExtractionResponse, mergeExtractionResults, type ExtractionResult } from "@/lib/ai-extract";
import Anthropic from "@anthropic-ai/sdk";
import { getPlatformAIConfig } from "@/lib/ai-config";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Ordered list of free OpenRouter models that support vision (image) inputs.
// The first model is tried first; if OpenRouter returns a provider error we
// fall through to the next one automatically.
const VISION_FALLBACK_MODELS = [
  "meta-llama/llama-3.2-11b-vision-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen2-vl-7b-instruct:free",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;

const MEDIA_TYPES: Record<string, string> = {
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
  "image/gif": "image/gif",
};

// Helper to encode an SSE event
function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function extractWithOpenRouter(file: File, apiKey: string, model: string): Promise<ExtractionResult> {
  const type = file.type.toLowerCase();
  const mediaType = MEDIA_TYPES[type];
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
      model,
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

async function extractWithAnthropic(file: File, apiKey: string, model: string): Promise<ExtractionResult> {
  const anthropic = new Anthropic({ apiKey });
  const type = file.type.toLowerCase();
  const mediaType = MEDIA_TYPES[type] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const msg = await anthropic.messages.create({
    model: model || "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    system: "You are an expert OCR and data extraction AI. Follow instructions strictly.",
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: { type: "base64", media_type: mediaType, data: base64 },
        },
        { type: "text", text: EXTRACTION_PROMPT },
      ],
    }],
  });

  // @ts-expect-error Extracting text block
  const content = msg.content[0]?.text || "";
  return parseExtractionResponse(content);
}

export async function POST(request: Request) {
  if (!await checkRateLimit(getClientIp(request), { id: "extract-menu", max: 5, windowMs: 60_000 })) {
    return Response.json(
      { error: "Too many requests. Please wait a minute before trying again." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const { provider, model } = await getPlatformAIConfig();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

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

  if (files.length === 0) return Response.json({ error: "No file provided" }, { status: 400 });
  if (files.length > MAX_FILES) return Response.json({ error: `Maximum ${MAX_FILES} images allowed` }, { status: 400 });

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: `File "${file.name}" exceeds 10MB limit` }, { status: 400 });
    }
    if (file.type === "application/pdf") {
      return Response.json({ error: "PDF is not supported. Please upload an image (JPG, PNG, WebP, GIF)." }, { status: 400 });
    }
    if (!MEDIA_TYPES[file.type.toLowerCase()]) {
      return Response.json({ error: `Unsupported file type: ${file.type}. Use JPG, PNG, WebP, or GIF.` }, { status: 400 });
    }
  }

  // ── SSE streaming response ──────────────────────────────────────────────
  const sseHeaders: HeadersInit = {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no", // Disable nginx buffering
  };

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (data: object) => controller.enqueue(enc.encode(sseEvent(data)));

      try {
        send({ type: "progress", step: "Preparing extraction...", pct: 5 });

        const results: ExtractionResult[] = [];

        if (provider === "anthropic") {
          const apiKey = process.env.ANTHROPIC_API_KEY;
          if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");
          
          for (let i = 0; i < files.length; i++) {
            const label = files.length === 1
              ? "Analysing menu with AI..."
              : `Analysing image ${i + 1} of ${files.length}...`;
            const pct = Math.round(10 + ((i / files.length) * 75));
            send({ type: "progress", step: label, pct });
            results.push(await extractWithAnthropic(files[i], apiKey, model));
          }
        } else {
          const apiKey = process.env.OPENROUTER_API_KEY;
          if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

          // Build fallback list: configured model first, then remaining vision models
          const fallbackChain = [
            model,
            ...VISION_FALLBACK_MODELS.filter((m) => m !== model),
          ];

          for (let i = 0; i < files.length; i++) {
            const label = files.length === 1
              ? "Analysing menu with AI..."
              : `Analysing image ${i + 1} of ${files.length}...`;
            const pct = Math.round(10 + ((i / files.length) * 75));
            send({ type: "progress", step: label, pct });

            let extracted: ExtractionResult | null = null;
            let lastError: Error | null = null;
            for (const candidate of fallbackChain) {
              try {
                extracted = await extractWithOpenRouter(files[i], apiKey, candidate);
                break; // success — stop trying
              } catch (err) {
                lastError = err instanceof Error ? err : new Error(String(err));
                console.warn(`Model ${candidate} failed: ${lastError.message}. Trying next fallback…`);
              }
            }
            if (!extracted) throw lastError ?? new Error("All OpenRouter vision models failed");
            results.push(extracted);
          }
        }

        send({ type: "progress", step: "Merging results...", pct: 90 });
        const merged = mergeExtractionResults(results);

        send({ type: "progress", step: "Done!", pct: 100 });
        send({ type: "result", data: merged });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "AI extraction failed";
        console.error("Extract menu error:", msg);
        send({ type: "error", error: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders });
}
