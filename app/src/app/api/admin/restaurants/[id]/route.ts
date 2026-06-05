import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isPlatformAdmin } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: PageProps) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isPlatformAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });

    const [
      { data: restaurant },
      { data: menus },
      { data: orders },
      { data: transactions },
    ] = await Promise.all([
      admin.from("restaurants").select("id, name, slug, plan, trial_ends_at, plan_expires_at, created_at, onboarded, custom_domain, category, user_id").eq("id", id).single(),
      admin.from("menus").select("id, name, slug, status, created_at, updated_at, categories").eq("restaurant_id", id).order("updated_at", { ascending: false }),
      admin.from("orders").select("id, items, total, status, source, customer_name, table_number, created_at").eq("restaurant_id", id).order("created_at", { ascending: false }).limit(20),
      admin.from("transactions").select("id, deposit_id, amount, currency, plan_name, status, created_at").eq("restaurant_id", id).order("created_at", { ascending: false }),
    ]);

    if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

    // Resolve owner email
    const { data: { user: owner } } = await admin.auth.admin.getUserById(restaurant.user_id);
    const ownerEmail = owner?.email ?? null;

    // Enrich menus with item count
    const enrichedMenus = (menus ?? []).map(m => {
      const categories = (m.categories ?? []) as { items?: unknown[] }[];
      const itemCount = categories.reduce((sum, c) => sum + (c.items?.length ?? 0), 0);
      return { id: m.id, name: m.name, slug: m.slug, status: m.status, createdAt: m.created_at, updatedAt: m.updated_at, itemCount };
    });

    // Simple analytics snapshot for last 30 days
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: events } = await admin.from("analytics_events").select("event_type, amount").eq("restaurant_id", id).gte("created_at", since);
    const views = (events ?? []).filter(e => e.event_type === "menu_view").length;
    const orderEvents = (events ?? []).filter(e => e.event_type === "order_sent");
    const revenue = orderEvents.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const conversionRate = views > 0 ? ((orderEvents.length / views) * 100) : 0;

    // Resolve plan
    const now = new Date();
    const resolvedPlan =
      restaurant.plan === "free" && restaurant.trial_ends_at && new Date(restaurant.trial_ends_at) > now
        ? "trial"
        : restaurant.plan;

    return NextResponse.json({
      restaurant: {
        ...restaurant,
        ownerEmail,
        resolvedPlan,
      },
      menus: enrichedMenus,
      recentOrders: orders ?? [],
      transactions: (transactions ?? []).map(tx => ({
        id: tx.id,
        depositId: tx.deposit_id,
        amount: Number(tx.amount),
        currency: tx.currency,
        plan: tx.plan_name,
        status: tx.status,
        createdAt: tx.created_at,
      })),
      analytics: { views, orders: orderEvents.length, revenue, conversionRate },
    });
  } catch (err) {
    console.error("admin/restaurants/[id] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
