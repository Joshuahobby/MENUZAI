import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    if (!checkRateLimit(getClientIp(req), { id: "reviews", max: 5, windowMs: 5 * 60_000 })) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const { restaurantId, rating, customerName, comment, orderId } = await req.json();

    if (!restaurantId || !rating) {
      return NextResponse.json({ error: "Missing required fields: restaurantId and rating are required." }, { status: 400 });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: "Rating must be an integer between 1 and 5." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database client unavailable." }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .insert({
        restaurant_id: restaurantId,
        rating: numericRating,
        customer_name: customerName || null,
        comment: comment || null,
        order_id: orderId || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error inserting review:", error);
      return NextResponse.json({ error: "Failed to save review in database." }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    console.error("Reviews API error:", err);
    return NextResponse.json({ 
      error: "Internal server error",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
