import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const PLAN_ORDER: Record<string, number> = { free: 0, pro: 1, business: 2 };

export async function POST(req: Request) {
  try {
    const { plan: targetPlan } = await req.json();

    if (!targetPlan || !(targetPlan in PLAN_ORDER)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id, plan")
      .eq("user_id", user.id)
      .single();

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const currentRank = PLAN_ORDER[restaurant.plan ?? "free"] ?? 0;
    const targetRank = PLAN_ORDER[targetPlan];

    // Only allow downgrades through this endpoint; upgrades require payment
    if (targetRank >= currentRank) {
      return NextResponse.json({ error: "Use the payment flow to upgrade" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) throw new Error("Server configuration error.");

    const { error } = await admin
      .from("restaurants")
      .update({ plan: targetPlan, plan_expires_at: null })
      .eq("id", restaurant.id);

    if (error) throw error;

    return NextResponse.json({ success: true, plan: targetPlan });
  } catch (error: unknown) {
    console.error("Plan change error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
