import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { rating, customerName, comment, restaurantName } = await req.json();

    if (rating === undefined || rating === null) {
      return NextResponse.json({ error: "Rating is required" }, { status: 400 });
    }

    const name = customerName || "our valued guest";
    const commentContext = comment ? `and left the following feedback: "${comment}"` : "with no written comment.";

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
    }

    // Fallback template builder if external API is slow or offline
    const buildFallbackReply = () => {
      if (rating >= 4) {
        return `Dear ${name},\n\nThank you so much for the stellar ${rating}-star rating! We are absolutely thrilled to hear that you had a wonderful dining experience with us. ${comment ? "We have shared your kind feedback with our kitchen and service team!" : "We look forward to serving you again soon!"}\n\nWarm regards,\nThe Management at ${restaurantName}`;
      } else if (rating === 3) {
        return `Dear ${name},\n\nThank you for sharing your feedback with us. We appreciate your ${rating}-star rating and are glad your experience was satisfactory. ${comment ? "We take your comments seriously and will use them to keep improving." : "Please let us know how we can make your next visit a 5-star experience!"}\n\nWarm regards,\nThe Management at ${restaurantName}`;
      } else {
        return `Dear ${name},\n\nThank you for reaching out and sharing your experience. We are deeply sorry that your visit did not meet your expectations. ${comment ? `We have taken note of your comments regarding "${comment}" and are actively addressing this with our staff.` : "We take all feedback seriously and would love the opportunity to make this right."}\n\nSincerest apologies,\nThe Management at ${restaurantName}`;
      }
    };

    // Attempt to generate a tailored response from the AI model
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://menuza.ai",
          "X-Title": "MenuZAI"
        },
        body: JSON.stringify({
          model: "google/gemma-2-9b-it:free",
          messages: [
            {
              role: "system",
              content: `You are an expert hospitality public relations specialist replying on behalf of "${restaurantName}".
Write a highly professional, polite, warm, and appropriate reply to a customer who gave a ${rating}-star rating ${commentContext}.
Keep the reply professional, structured, brief (2-3 sentences), and do not use placeholders or [Your Name]. Sign off purely as "The Management at ${restaurantName}".`
            }
          ],
          temperature: 0.7,
        })
      });

      if (response.ok) {
        const json = await response.json();
        const replyText = json?.choices?.[0]?.message?.content;
        if (replyText) {
          return NextResponse.json({ success: true, reply: replyText.trim() });
        }
      }
    } catch (aiErr) {
      console.warn("AI generation failed, using premium template fallback:", aiErr);
    }

    return NextResponse.json({ success: true, reply: buildFallbackReply() });
  } catch (error: unknown) {
    console.error("AI reply error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
