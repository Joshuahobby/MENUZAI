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
      admin.from("restaurants").select("id, name, plan, trial_ends_at, plan_expires_at, created_at, onboarded, custom_domain, category, user_id, payments_enabled").eq("id", id).single(),
      admin.from("menus").select("id, name, slug, status, created_at, updated_at, categories").eq("restaurant_id", id).order("updated_at", { ascending: false }),
      admin.from("orders").select("id, items, total, status, source, customer_name, table_number, created_at").eq("restaurant_id", id).order("created_at", { ascending: false }).limit(20),
      admin.from("transactions").select("id, deposit_id, amount, currency, plan_name, status, created_at").eq("restaurant_id", id).order("created_at", { ascending: false }),
    ]);

    if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

    const { data: { user: owner } } = await admin.auth.admin.getUserById(restaurant.user_id);
    const ownerEmail = owner?.email ?? null;

    const enrichedMenus = (menus ?? []).map(m => {
      const categories = (m.categories ?? []) as { items?: unknown[] }[];
      const itemCount = categories.reduce((sum, c) => sum + (c.items?.length ?? 0), 0);
      return { id: m.id, name: m.name, slug: m.slug, status: m.status, createdAt: m.created_at, updatedAt: m.updated_at, itemCount };
    });
    const publishedSlug = (menus ?? []).find(m => m.status === "published" && m.slug)?.slug ?? null;

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: events } = await admin.from("analytics_events").select("event_type, amount").eq("restaurant_id", id).gte("created_at", since);
    const views = (events ?? []).filter(e => e.event_type === "menu_view").length;
    const orderEvents = (events ?? []).filter(e => e.event_type === "order_sent");
    const revenue = orderEvents.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const conversionRate = views > 0 ? ((orderEvents.length / views) * 100) : 0;

    const now = new Date();
    const resolvedPlan =
      restaurant.plan === "free" && restaurant.trial_ends_at && new Date(restaurant.trial_ends_at) > now
        ? "trial"
        : restaurant.plan;

    return NextResponse.json({
      restaurant: { ...restaurant, ownerEmail, resolvedPlan, publishedSlug },
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
    console.error("admin/restaurants/[id] GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Toggle payments_enabled or onboarded
export async function PATCH(req: Request, { params }: PageProps) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isPlatformAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });

    const body = await req.json().catch(() => ({})) as { field?: string; value?: unknown };
    const ALLOWED_FIELDS = ["payments_enabled", "onboarded"];
    if (!body.field || !ALLOWED_FIELDS.includes(body.field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("restaurants")
      .update({ [body.field]: body.value })
      .eq("id", id)
      .select("id, payments_enabled, onboarded")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, restaurant: data });
  } catch (err) {
    console.error("admin/restaurants/[id] PATCH error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Permanently delete restaurant + auth user
export async function DELETE(_req: Request, { params }: PageProps) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isPlatformAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });

    const { data: restaurant } = await admin
      .from("restaurants")
      .select("id, name, user_id")
      .eq("id", id)
      .single();

    if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });

    // Delete restaurant row — cascades to menus, orders, staff, analytics, etc.
    const { error: deleteError } = await admin.from("restaurants").delete().eq("id", id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    // Delete auth user (non-fatal if it fails — restaurant data is already gone).
    // Never delete the auth account of a platform admin.
    if (restaurant.user_id) {
      const { data: { user: targetUser } } = await admin.auth.admin.getUserById(restaurant.user_id)
        .catch(() => ({ data: { user: null } }));
      if (isPlatformAdmin(targetUser?.email)) {
        console.warn("admin: skipped auth-user deletion for platform admin", targetUser?.email);
      } else {
        await admin.auth.admin.deleteUser(restaurant.user_id).catch(e =>
          console.error("Failed to delete auth user after restaurant deletion:", e)
        );
      }
    }

    // Audit log (fire-and-forget — non-fatal)
    void admin.from("admin_audit_log").insert({
      action: "restaurant_deleted",
      performed_by: user.email,
      target_type: "restaurant",
      target_id: id,
      target_name: restaurant.name,
      old_value: { id, name: restaurant.name },
      new_value: null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("admin/restaurants/[id] DELETE error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
