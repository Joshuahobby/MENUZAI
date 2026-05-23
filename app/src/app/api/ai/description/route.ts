import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { headers } from "next/headers";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
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
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { name, tags } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }

    let provider = "anthropic";
    let model = "claude-3-5-sonnet-20241022";

    try {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data } = await admin.from("platform_settings").select("*").eq("id", "global").single();
        if (data?.ai_provider) provider = data.ai_provider;
        if (data?.ai_model) model = data.ai_model;
      }
    } catch (e) {
      console.warn("Could not fetch platform settings, falling back to Anthropic", e);
    }

    const systemPrompt = `You are an expert culinary copywriter for high-end and modern restaurants.
Write a mouth-watering, appealing, and concise description for a menu item.
Keep it strictly between 1 to 2 short sentences. No introductory text, no quotes, just the description itself.`;

    const userPrompt = `Item Name: ${name}\nTags/Dietary info: ${(tags || []).join(", ") || "None"}\nWrite the description now.`;

    let description = "";

    if (provider === "anthropic") {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

      const anthropic = new Anthropic({ apiKey });
      const msg = await anthropic.messages.create({
        model,
        max_tokens: 150,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      // @ts-expect-error extracting text block
      description = msg.content[0]?.text || "";
    } else {
      // OpenRouter fallback
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

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
          max_tokens: 150,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as any).error?.message ?? `OpenRouter error ${response.status}`);
      }

      const data = await response.json();
      description = data.choices[0]?.message?.content || "";
    }

    return NextResponse.json({ description: description.trim() });
  } catch (error: any) {
    console.error("AI Generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate description" }, { status: 500 });
  }
}
