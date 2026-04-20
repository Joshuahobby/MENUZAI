import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  const requestedDays = parseInt(searchParams.get("days") || "30", 10);

  if (!restaurantId) {
    return Response.json({ error: "restaurantId required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Enforce plan-based date range: free plan capped at 7 days
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("plan")
    .eq("id", restaurantId)
    .single();

  const isPro = restaurant?.plan && restaurant.plan !== "free";
  const days = isPro ? Math.min(requestedDays, 90) : Math.min(requestedDays, 7);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // RLS ensures only the authenticated owner's events are returned
  const { data: events } = await supabase
    .from("analytics_events")
    .select("event_type, item_name, amount, created_at")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (!events) {
    return Response.json({ kpis: {}, topItems: [], peakHours: [], recentEvents: [] });
  }

  const views = events.filter(e => e.event_type === "menu_view").length;
  const orders = events.filter(e => e.event_type === "order_sent");
  const orderCount = orders.length;
  const revenue = orders.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;
  const conversionRate = views > 0 ? (orderCount / views) * 100 : 0;

  const itemCounts: Record<string, number> = {};
  events
    .filter(e => e.item_name && (e.event_type === "item_view" || e.event_type === "order_sent"))
    .forEach(e => { itemCounts[e.item_name!] = (itemCounts[e.item_name!] || 0) + 1; });
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const hourCounts = new Array(24).fill(0);
  events.forEach(e => {
    const hour = new Date(e.created_at).getHours();
    hourCounts[hour]++;
  });
  const peakHours = hourCounts.map((count, hour) => ({ hour, count }));

  const recentEvents = events.slice(0, 20).map(e => ({
    type: e.event_type,
    item: e.item_name,
    amount: e.amount,
    time: e.created_at,
  }));

  return Response.json({
    kpis: { views, orders: orderCount, revenue, avgOrderValue, conversionRate },
    topItems,
    peakHours,
    recentEvents,
    meta: { days, plan: restaurant?.plan ?? "free" },
  });
}
