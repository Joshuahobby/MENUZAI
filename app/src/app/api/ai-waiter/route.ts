import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getPlatformAIConfig } from "@/lib/ai-config";

export async function POST(request: Request) {
  const { provider, model } = await getPlatformAIConfig();

  try {
    const { messages, menuItems, restaurantName, aiWaiterSettings, restaurantId, tableNumber } = await request.json();

    // Plan gate: AI Waiter is Pro-only
    if (restaurantId) {
      try {
        const adminClient = getSupabaseAdmin();
        if (adminClient) {
          const { data: restaurant } = await adminClient
            .from("restaurants")
            .select("plan, trial_ends_at")
            .eq("id", restaurantId)
            .maybeSingle();
          const isOnTrial = restaurant?.trial_ends_at && new Date(restaurant.trial_ends_at) > new Date();
          if (restaurant?.plan === "free" && !isOnTrial) {
            return Response.json(
              { error: "AI Digital Waiter requires a Pro plan. Upgrade at /pricing to unlock it." },
              { status: 402 }
            );
          }
        }
      } catch {
        // If plan lookup fails, allow through (graceful degradation)
      }
    }

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const customTone = aiWaiterSettings?.tone || "friendly";
    const customUpsell = aiWaiterSettings?.upsell || "";
    const customInstructions = aiWaiterSettings?.instructions || "";

    let toneDescription = "";
    if (customTone === "formal") {
      toneDescription = "Act as an elegant, polite, and highly formal fine-dining server. Speak with absolute refinement, respect, and class.";
    } else if (customTone === "vibrant") {
      toneDescription = "Act as a high-energy, vibrant, and enthusiastic server. Use positive, vivid adjectives and showcase immense passion for our dishes and pairings.";
    } else {
      toneDescription = "Act as a friendly, warm, and casual server. Keep it highly inviting, approachable, and delightful.";
    }

    const tableContext = tableNumber ? `The guest is at table ${tableNumber}.` : "Table number is not yet known.";

    const systemPrompt = `You are a premium, highly engaging AI Digital Waiter for the restaurant "${restaurantName}".
Your goal is to guide customers browsing our digital menu, recommend perfect pairings, increase sales through delightful service, and take their full order directly in this chat.

PERSONALITY TONE:
${toneDescription}

CURRENT TABLE CONTEXT:
${tableContext}

MENU DATA:
${JSON.stringify(menuItems, null, 2)}

YOUR BEHAVIORAL PROTOCOLS:
1. Warm & Conversational: Greet guests enthusiastically. Act as a knowledgeable culinary guide rather than a search query engine.
2. Proactive Upselling & Pairings: When a guest inquires about a dish, always suggest a complementary pairing (like a signature beverage, appetizer, or dessert) from the menu. ${customUpsell ? `CUSTOM UP-SELLING STRATEGY: ${customUpsell}` : `Emphasize items marked as "popular" or "chefs-pick" to guide choices.`}
3. Accurate & Trustworthy: Base all recommendations strictly on the provided MENU DATA. If an item or ingredient is not listed, politely state we don't have it and guide them to the closest mouthwatering alternative. Never hallucinate items or prices.
4. Concise & Mobile-Scannable: Keep responses structured, visually appealing, and brief (under 3–4 sentences). Use bold text for dish names so it's easy to read on mobile screens.
5. Warm Emojis: Use emojis naturally to keep the tone friendly, appetizing, and inviting (e.g., 🍽️, ✨, 🥩, 🍷, 🍰).
${customInstructions ? `\nADDITIONAL RESTAURANT-SPECIFIC GUIDELINES:\n${customInstructions}` : ""}

IN-CHAT ORDER TAKING PROTOCOL:
When a guest clearly states they want to order specific items (e.g., "I'll have the Nyama Choma and a Fanta", "Can I get 2 samosas?", "Order the grilled chicken for me"):
1. If the table number is not known, ask: "Perfect choice! What's your table number so I can send your order straight to the kitchen? 🍽️"
2. Once you have both the items AND the table number (or if table is already known), respond with a warm confirmation message, then append this EXACT marker on its own at the very end, with no text after it:
__ORDER__:{"items":[{"name":"<exact item name>","qty":<number>}],"table":"<table number or empty string if unknown>"}
3. Only emit __ORDER__: when the guest has explicitly confirmed what they want. Include every item they requested. Use the exact item names from MENU DATA.
4. If a guest asks to "add" something to an existing order in the conversation, include all items together in the __ORDER__ block.
5. Do NOT emit __ORDER__: for browsing, questions, or recommendations — only for actual order placement.`;

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
