import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isPlatformAdmin } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Hardcoded defaults — used as fallback if DB column is missing (pre-migration)
export const DEFAULT_PRICES = { pro: 35_000, business: 89_000 };

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.email || !isPlatformAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Configuration missing" }, { status: 500 });

  const now = new Date().toISOString();

  const [allRestaurants, trialActiveResult, settingsResult] = await Promise.all([
    admin.from("restaurants").select("plan"),
    admin
      .from("restaurants")
      .select("id", { count: "exact", head: true })
      .eq("plan", "free")
      .gt("trial_ends_at", now),
    admin.from("platform_settings").select("plan_prices").eq("id", "global").single(),
  ]);

  const rawPrices = settingsResult.data?.plan_prices as Record<string, number> | null;
  const prices = {
    pro: rawPrices?.pro ?? DEFAULT_PRICES.pro,
    business: rawPrices?.business ?? DEFAULT_PRICES.business,
  };

  const plans = (allRestaurants.data ?? []).map(r => r.plan ?? "free");
  const proCount = plans.filter(p => p === "pro").length;
  const businessCount = plans.filter(p => p === "business").length;
  const freeTotal = plans.filter(p => p === "free").length;
  const trialActiveCount = trialActiveResult.count ?? 0;
  const freeLiteCount = Math.max(0, freeTotal - trialActiveCount);

  return NextResponse.json({
    plans: { trial: trialActiveCount, free: freeLiteCount, pro: proCount, business: businessCount },
    mrr: {
      pro: proCount * prices.pro,
      business: businessCount * prices.business,
      total: proCount * prices.pro + businessCount * prices.business,
    },
    prices,
  });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.email || !isPlatformAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Configuration missing" }, { status: 500 });

  const body = await req.json().catch(() => null);
  const pro = Number(body?.pro);
  const business = Number(body?.business);

  if (!pro || !business || pro < 1000 || business < 1000 || pro > 10_000_000 || business > 10_000_000) {
    return NextResponse.json({ error: "Invalid prices. Must be between 1,000 and 10,000,000 RWF." }, { status: 400 });
  }

  // Read old prices for audit log
  const { data: current } = await admin
    .from("platform_settings")
    .select("plan_prices")
    .eq("id", "global")
    .single();

  const oldPrices = (current?.plan_prices as Record<string, number>) ?? DEFAULT_PRICES;
  const newPrices = { pro, business };

  const { error: updateError } = await admin
    .from("platform_settings")
    .update({ plan_prices: newPrices, updated_at: new Date().toISOString() })
    .eq("id", "global");

  if (updateError) {
    return NextResponse.json({ error: "Failed to update prices" }, { status: 500 });
  }

  // Write audit log
  await admin.from("admin_audit_log").insert({
    action: "plan_price_change",
    performed_by: user.email,
    target_type: "platform",
    target_id: "global",
    target_name: "Plan Pricing",
    old_value: oldPrices,
    new_value: newPrices,
  });

  return NextResponse.json({ success: true, prices: newPrices });
}
