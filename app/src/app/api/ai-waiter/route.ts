import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
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

    const anthropic = new Anthropic({ apiKey });

    // Ensure we only pass user/assistant messages to Anthropic
    const anthropicMessages = messages.filter(m => m.role === "user" || m.role === "assistant");

    console.log("AI Waiter: Calling Claude 3.5 Sonnet...");
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      temperature: 0.7,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    // @ts-expect-error Types for content block can be text
    const content = msg.content[0]?.text || "I'm sorry, I couldn't process that request.";
    console.log("AI Waiter: Success with Claude 3.5 Sonnet");
    
    return Response.json({ content });

  } catch (error: unknown) {
    console.error("AI Route Error:", error);
    return Response.json({
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
