import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isPlatformAdmin } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PRO_PRICE = 35_000;
const BUSINESS_PRICE = 89_000;

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.email || !isPlatformAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Configuration missing" }, { status: 500 });

  const now = new Date().toISOString();

  const [allRestaurants, trialActiveResult] = await Promise.all([
    admin.from("restaurants").select("plan"),
    admin
      .from("restaurants")
      .select("id", { count: "exact", head: true })
      .eq("plan", "free")
      .gt("trial_ends_at", now),
  ]);

  const plans = (allRestaurants.data ?? []).map(r => r.plan ?? "free");
  const proCount = plans.filter(p => p === "pro").length;
  const businessCount = plans.filter(p => p === "business").length;
  const freeTotal = plans.filter(p => p === "free").length;
  const trialActiveCount = trialActiveResult.count ?? 0;
  const freeLiteCount = Math.max(0, freeTotal - trialActiveCount);

  return NextResponse.json({
    plans: {
      trial: trialActiveCount,
      free: freeLiteCount,
      pro: proCount,
      business: businessCount,
    },
    mrr: {
      pro: proCount * PRO_PRICE,
      business: businessCount * BUSINESS_PRICE,
      total: proCount * PRO_PRICE + businessCount * BUSINESS_PRICE,
    },
    prices: {
      pro: PRO_PRICE,
      business: BUSINESS_PRICE,
    },
  });
}
