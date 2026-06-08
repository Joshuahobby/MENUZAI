import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isPlatformAdmin } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.email || !isPlatformAdmin(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Configuration missing" }, { status: 500 });

  const now = new Date();
  const todayUtc = new Date(now);
  todayUtc.setUTCHours(0, 0, 0, 0);

  const [
    allRestaurants,
    trialActiveResult,
    menus,
    orders,
    ordersToday,
    aiOrders,
    settingsResult,
    recentResult,
  ] = await Promise.all([
    admin.from("restaurants").select("plan"),
    admin
      .from("restaurants")
      .select("id", { count: "exact", head: true })
      .eq("plan", "free")
      .gt("trial_ends_at", now.toISOString()),
    admin.from("menus").select("status"),
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id", { count: "exact", head: true }).gte("created_at", todayUtc.toISOString()),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("source", "ai_waiter"),
    admin.from("platform_settings").select("plan_prices").eq("id", "global").single(),
    admin
      .from("restaurants")
      .select("id, name, plan, trial_ends_at, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const rawPrices = settingsResult.data?.plan_prices as { pro?: number; business?: number } | null;
  const proPrice      = rawPrices?.pro      ?? 35_000;
  const businessPrice = rawPrices?.business ?? 89_000;

  const plans        = (allRestaurants.data ?? []).map(r => r.plan ?? "free");
  const proCount     = plans.filter(p => p === "pro").length;
  const businessCount = plans.filter(p => p === "business").length;
  const freeTotal    = plans.filter(p => p === "free").length;
  const trialCount   = trialActiveResult.count ?? 0;
  const freeLiteCount = Math.max(0, freeTotal - trialCount);
  const mrrRwf       = proCount * proPrice + businessCount * businessPrice;

  return NextResponse.json({
    totalRestaurants: plans.length,
    freeLiteCount,
    trialCount,
    proCount,
    businessCount,
    mrrRwf,
    proPrice,
    businessPrice,
    totalOrders:    orders.count ?? 0,
    ordersToday:    ordersToday.count ?? 0,
    aiWaiterOrders: aiOrders.count ?? 0,
    totalMenus:     (menus.data ?? []).length,
    publishedMenus: (menus.data ?? []).filter(m => m.status === "published").length,
    recentRestaurants: recentResult.data ?? [],
  });
}
