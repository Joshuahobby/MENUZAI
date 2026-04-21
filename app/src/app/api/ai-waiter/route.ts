import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
  }

  try {
    const { messages, menuItems, restaurantName } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const systemPrompt = `You are a helpful digital waiter for the restaurant "${restaurantName}".
Your goal is to assist customers browsing the digital menu.

MENU DATA:
${JSON.stringify(menuItems, null, 2)}

INSTRUCTIONS:
1. Use the provided menu data to answer questions about dishes, ingredients, prices, and dietary preferences.
2. If an item is mentioned, emphasize its qualities (e.g., "Our ${menuItems[0]?.name || "dishes"} are highly recommended!").
3. Be polite, professional, and concise.
4. If a customer asks about something not on the menu, politely inform them we don't have it but suggest a close alternative.
5. Do NOT make up items or prices.
6. Keep responses under 3 sentences for better mobile viewing.
7. Use emojis occasionally to be friendly. 🍽️✨`;

    const models = [
      "google/gemma-4-31b-it:free",
      "google/gemma-4-26b-a4b-it:free",
      "google/gemma-3-12b-it:free",
      "qwen/qwen3-next-80b-a3b-instruct:free",
      "openai/gpt-oss-20b:free",
    ];

    let lastError = "";
    for (const model of models) {
      try {
        console.log(`AI Waiter: Trying model ${model}...`);
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://menuzaai.com",
            "X-Title": "MENUZAI Assistant",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemPrompt },
              ...messages
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";
          console.log(`AI Waiter: Success with ${model}`);
          return Response.json({ content });
          return NextResponse.json({ content });
        } else {
          const errData = await response.json().catch(() => ({}));
          lastError = errData.error?.message || `Status ${response.status}`;
          console.warn(`AI Waiter: ${model} failed - ${lastError}`);
        }
      } catch (error: unknown) {
        console.error("AI Assistant Error:", error);
        return NextResponse.json({ 
          error: "Failed to fetch AI response",
          details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
      }
    }

    throw new Error(`All AI models failed. Last error: ${lastError}`);
  } catch (error: unknown) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
