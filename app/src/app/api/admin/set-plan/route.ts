import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isPlatformAdmin } from "@/lib/utils";

const VALID_PLANS = ["free", "pro", "business"] as const;
type Plan = (typeof VALID_PLANS)[number];

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isPlatformAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { restaurantId, plan, expiryDays } = await req.json() as {
      restaurantId: string;
      plan: Plan;
      expiryDays?: number;
    };

    if (!restaurantId || !VALID_PLANS.includes(plan)) {
      return NextResponse.json({ error: "Invalid restaurantId or plan" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });

    // Read current state for audit log
    const { data: current } = await admin
      .from("restaurants")
      .select("name, plan, plan_expires_at")
      .eq("id", restaurantId)
      .single();

    if (!current) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

    // Calculate new expiry
    const days = plan === "free" ? null : (expiryDays ?? 30);
    const planExpiresAt = days
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Update restaurant
    const { data: updated, error: updateError } = await admin
      .from("restaurants")
      .update({ plan, plan_expires_at: planExpiresAt })
      .eq("id", restaurantId)
      .select("id, name, plan, plan_expires_at, trial_ends_at")
      .single();

    if (updateError) throw updateError;

    // Write audit log (non-blocking)
    void Promise.resolve(
      admin.from("admin_audit_log").insert({
        action: "plan_override",
        performed_by: user.email!,
        target_type: "restaurant",
        target_id: restaurantId,
        target_name: current.name,
        old_value: { plan: current.plan, planExpiresAt: current.plan_expires_at },
        new_value: { plan, planExpiresAt, expiryDays: days },
      })
    ).catch((e: unknown) => console.warn("audit log insert failed", e));

    return NextResponse.json({ success: true, restaurant: updated });
  } catch (err) {
    console.error("admin/set-plan error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
