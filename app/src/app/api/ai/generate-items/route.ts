import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { checkRateLimitBool } from "@/lib/rate-limit";
import { getPlatformAIConfig } from "@/lib/ai-config";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!await checkRateLimitBool(user.id, { id: "ai-generate-items", max: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Rate limit exceeded. Please wait a moment." }, { status: 429 });
  }

  try {
    const { prompt: userPrompt, categoryId, currency } = await request.json();

    if (!userPrompt || !categoryId) {
      return NextResponse.json({ error: "Prompt and categoryId are required" }, { status: 400 });
    }

    const { provider, model } = await getPlatformAIConfig();

    const currencyCode = currency || "RWF";

    const systemPrompt = `You are a professional menu consultant and culinary expert helping restaurants build digital menus.
When given a prompt, you generate menu items as a JSON array.

STRICT rules:
- Respond ONLY with a valid JSON array. No markdown, no explanation, no code fences.
- Each item must have: name (string), description (string, 1-2 appealing sentences), price (number in ${currencyCode}), tags (string array, e.g. ["vegan", "spicy", "gluten-free"])
- Generate between 3 and 8 items based on the prompt. Use realistic local prices for the currency.
- Make descriptions mouth-watering and professional.
- Example output: [{"name":"Grilled Salmon","description":"Pan-seared Atlantic salmon with lemon butter sauce.","price":8500,"tags":["gluten-free"]}]`;

    const fullPrompt = `Generate menu items for the following request: "${userPrompt}"`;

    let rawText = "";

    if (provider === "anthropic") {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

      const anthropic = new Anthropic({ apiKey });
      const msg = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: fullPrompt }],
      });

      if ((msg as { stop_reason?: string }).stop_reason === "content_filter") {
        throw new Error("Model flagged content as unsafe");
      }
      // @ts-expect-error text block extraction
      rawText = msg.content[0]?.text || "";
    } else {
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
          max_tokens: 1024,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: fullPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? `OpenRouter error ${response.status}`);
      }

      const data = await response.json() as { choices: { message: { content: string }; finish_reason: string }[] };
      const choice = data.choices?.[0];
      if (!choice) throw new Error("OpenRouter returned no choices");
      if (choice.finish_reason === "content_filter" || choice.finish_reason === "safety") {
        throw new Error(`Model flagged content as unsafe (finish_reason: ${choice.finish_reason})`);
      }
      rawText = choice.message?.content || "";
    }

    // Strip markdown fences and extract just the JSON array (handles leading/trailing prose)
    let cleaned = rawText.replace(/```json|```/g, "").trim();
    const arrayStart = cleaned.indexOf("[");
    const arrayEnd = cleaned.lastIndexOf("]");
    if (arrayStart === -1 || arrayEnd === -1 || arrayEnd < arrayStart) {
      const snippet = cleaned.length > 120 ? cleaned.slice(0, 120) + "..." : cleaned;
      throw new Error(`AI returned non-JSON response: "${snippet}"`);
    }
    cleaned = cleaned.slice(arrayStart, arrayEnd + 1);
    // Remove trailing commas before } or ] (common LLM mistake)
    cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");
    const items = JSON.parse(cleaned);

    if (!Array.isArray(items)) {
      throw new Error("AI returned invalid format");
    }

    // Map to MenuItem shape with UUIDs
    const menuItems = items.map((item: { name: string; description: string; price: number; tags: string[] }) => ({
      id: crypto.randomUUID(),
      name: item.name || "New Item",
      description: item.description || "",
      price: typeof item.price === "number" ? item.price : 0,
      category: categoryId,
      image: "",
      tags: Array.isArray(item.tags) ? item.tags : [],
      available: true,
    }));

    return NextResponse.json({ items: menuItems });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "AI generation failed";
    console.error("AI generate-items error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
