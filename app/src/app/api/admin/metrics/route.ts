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

  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  const [restaurants, menus, orders, ordersToday, aiOrders] = await Promise.all([
    admin.from("restaurants").select("plan"),
    admin.from("menus").select("status"),
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id", { count: "exact", head: true }).gte("created_at", todayUtc.toISOString()),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("source", "ai_waiter"),
  ]);

  const plans = (restaurants.data ?? []).map((r) => r.plan ?? "free");
  const freeCount     = plans.filter((p) => p === "free").length;
  const trialCount    = plans.filter((p) => p === "trial").length;
  const proCount      = plans.filter((p) => p === "pro").length;
  const businessCount = plans.filter((p) => p === "business").length;
  const mrrRwf        = proCount * PRO_PRICE + businessCount * BUSINESS_PRICE;

  return NextResponse.json({
    totalRestaurants: plans.length,
    freeCount,
    trialCount,
    proCount,
    businessCount,
    mrrRwf,
    totalOrders:    orders.count ?? 0,
    ordersToday:    ordersToday.count ?? 0,
    aiWaiterOrders: aiOrders.count ?? 0,
    totalMenus:     (menus.data ?? []).length,
    publishedMenus: (menus.data ?? []).filter((m) => m.status === "published").length,
  });
}
