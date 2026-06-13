import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isPlatformAdmin } from "@/lib/utils";

export const dynamic = "force-dynamic";

export interface RestaurantRow {
  id: string;
  name: string;
  slug: string | null;
  plan: string;
  resolvedPlan: string;
  ownerEmail: string | null;
  trialEndsAt: string | null;
  planExpiresAt: string | null;
  menuCount: number;
  orderCount: number;
  createdAt: string;
  onboarded: boolean;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isPlatformAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });

    const now = new Date().toISOString();

    const [restaurantsResult, menusResult, ordersResult, usersResult] = await Promise.all([
      admin.from("restaurants").select("id, name, slug, plan, trial_ends_at, plan_expires_at, created_at, user_id, onboarded"),
      admin.from("menus").select("restaurant_id"),
      admin.from("orders").select("restaurant_id"),
      admin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    if (restaurantsResult.error) console.error("admin/restaurants: restaurants query error", restaurantsResult.error);
    if (menusResult.error) console.error("admin/restaurants: menus query error", menusResult.error);
    if (ordersResult.error) console.error("admin/restaurants: orders query error", ordersResult.error);
    if (usersResult.error) console.error("admin/restaurants: listUsers error", usersResult.error);

    const restaurants = restaurantsResult.data ?? [];
    const menus = menusResult.data ?? [];
    const orders = ordersResult.data ?? [];
    const users = usersResult.data?.users ?? [];

    // Build lookup maps
    const emailMap = new Map(users.map((u) => [u.id, u.email ?? null]));
    const menuCounts = new Map<string, number>();
    const orderCounts = new Map<string, number>();
    for (const m of menus) menuCounts.set(m.restaurant_id, (menuCounts.get(m.restaurant_id) ?? 0) + 1);
    for (const o of orders) orderCounts.set(o.restaurant_id, (orderCounts.get(o.restaurant_id) ?? 0) + 1);

    const rows: RestaurantRow[] = restaurants.map((r) => {
      const isTrial = r.plan === "free" && r.trial_ends_at && r.trial_ends_at > now;
      return {
        id: r.id,
        name: r.name ?? "Unnamed",
        slug: r.slug ?? null,
        plan: r.plan ?? "free",
        resolvedPlan: isTrial ? "trial" : (r.plan ?? "free"),
        ownerEmail: emailMap.get(r.user_id) ?? null,
        trialEndsAt: r.trial_ends_at ?? null,
        planExpiresAt: r.plan_expires_at ?? null,
        menuCount: menuCounts.get(r.id) ?? 0,
        orderCount: orderCounts.get(r.id) ?? 0,
        createdAt: r.created_at,
        onboarded: r.onboarded ?? false,
      };
    });

    // Newest first
    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ restaurants: rows, total: rows.length });
  } catch (err) {
    console.error("admin/restaurants GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
