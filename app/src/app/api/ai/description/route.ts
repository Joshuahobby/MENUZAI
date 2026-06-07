import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getPlatformAIConfig } from "@/lib/ai-config";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!await checkRateLimit(user.id, { id: "ai-description", max: 20, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { name, tags } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }

    const { provider, model } = await getPlatformAIConfig();

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
        const err = await response.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(err.error?.message ?? `OpenRouter error ${response.status}`);
      }

      const data = await response.json();
      description = data.choices[0]?.message?.content || "";
    }

    return NextResponse.json({ description: description.trim() });
  } catch (error) {
    console.error("AI Generation error:", error);
    return NextResponse.json({ error: "Failed to generate description" }, { status: 500 });
  }
}
