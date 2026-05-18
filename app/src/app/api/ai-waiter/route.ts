import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  let provider = "openrouter";
  let model = "google/gemma-4-31b-it:free";

  try {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data } = await admin.from("platform_settings").select("*").eq("id", "global").single();
      if (data?.ai_provider) provider = data.ai_provider;
      if (data?.ai_model) model = data.ai_model;
    }
  } catch (e) {
    console.warn("Could not fetch platform settings, falling back to OpenRouter", e);
  }

  try {
    const { messages, menuItems, restaurantName } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const systemPrompt = `You are a premium, highly engaging AI Digital Waiter for the restaurant "${restaurantName}".
Your goal is to guide customers browsing our digital menu, recommend perfect pairings, and increase sales through delightful, polite, and persuasive service.

MENU DATA:
${JSON.stringify(menuItems, null, 2)}

YOUR BEHAVIORAL PROTOCOLS:
1. Warm & Conversational: Greet guests enthusiastically. Act as a knowledgeable culinary guide rather than a search query engine.
2. Proactive Upselling & Pairings: When a guest inquires about a dish, always suggest a complementary pairing (like a signature beverage, appetizer, or dessert) from the menu. Emphasize items marked as "popular" or "chefs-pick" to guide choices.
3. Accurate & Trustworthy: Base all recommendations strictly on the provided MENU DATA. If an item or ingredient is not listed, politely state we don't have it and guide them to the closest mouthwatering alternative. Never hallucinate items or prices.
4. Ordering Guidance: Gently remind guests they can add their favorite items to the cart and order instantly: "Just tap the Add button to add it to your order! 🛒"
5. Concise & Mobile-Scannable: Keep responses structured, visually appealing, and brief (under 3–4 sentences). Use bold text for dish names so it's easy to read on mobile screens.
6. Warm Emojis: Use emojis naturally to keep the tone friendly, appetizing, and inviting (e.g., 🍽️, ✨, 🥩, 🍷, 🍰).`;

    const streamHeaders: HeadersInit = {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache, no-transform",
    };

    if (provider === "anthropic") {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });

      const anthropic = new Anthropic({ apiKey });
      const anthropicMessages = messages.filter(
        (m: { role: string }) => m.role === "user" || m.role === "assistant"
      );

      console.log(`AI Waiter: Streaming via Claude (${model})...`);

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            const anthropicStream = await anthropic.messages.stream({
              model: model || "claude-3-5-sonnet-20241022",
              max_tokens: 500,
              temperature: 0.7,
              system: systemPrompt,
              messages: anthropicMessages,
            });

            for await (const chunk of anthropicStream) {
              if (
                chunk.type === "content_block_delta" &&
                chunk.delta.type === "text_delta"
              ) {
                controller.enqueue(encoder.encode(chunk.delta.text));
              }
            }
          } catch (err) {
            console.error("Anthropic stream error:", err);
            controller.enqueue(
              encoder.encode("Sorry, I ran into a problem. Please try again.")
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, { headers: streamHeaders });
    }

    // Default: OpenRouter with streaming
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return Response.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });

    console.log(`AI Waiter: Streaming via OpenRouter (${model})...`);

    const upstreamRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://menuzaai.com",
        "X-Title": "MENUZAI Assistant",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 500,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      const errData = await upstreamRes.json().catch(() => ({}));
      const msg = (errData as { error?: { message?: string } }).error?.message ?? `Status ${upstreamRes.status}`;
      throw new Error(msg);
    }

    // Transform OpenRouter SSE stream → raw text chunks for the client
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const reader = upstreamRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") continue;
              try {
                const parsed = JSON.parse(payload) as {
                  choices?: { delta?: { content?: string } }[];
                };
                const text = parsed.choices?.[0]?.delta?.content ?? "";
                if (text) controller.enqueue(encoder.encode(text));
              } catch {
                // Malformed SSE line — skip
              }
            }
          }
        } catch (err) {
          console.error("OpenRouter stream error:", err);
          controller.enqueue(
            encoder.encode("Sorry, I ran into a problem. Please try again.")
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: streamHeaders });
  } catch (error: unknown) {
    console.error("AI Route Error:", error);
    return Response.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
