import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { MenuItem } from "@/types/menu";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * POST /api/orders/confirm
 *
 * Body: { orderId: string, restaurantId: string }
 *
 * When a restaurant confirms an order:
 * 1. Marks the order status as "confirmed".
 * 2. For each ordered item that has a stock_count, decrements it by the ordered quantity.
 * 3. If stock_count reaches 0, sets available = false (auto sold-out) on the menu item.
 */
export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  let body: { orderId?: string; restaurantId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { orderId, restaurantId } = body;
  if (!orderId || !restaurantId) {
    return NextResponse.json({ error: "orderId and restaurantId are required" }, { status: 400 });
  }

  // Verify the caller is authenticated and is staff of this restaurant
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: staffRow } = await admin
    .from("restaurant_staff")
    .select("role")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", user.id)
    .single();
  if (!staffRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 1. Fetch the order
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id, items, menu_id, status, restaurant_id")
    .eq("id", orderId)
    .eq("restaurant_id", restaurantId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status === "confirmed" || order.status === "completed") {
    return NextResponse.json({ message: "Order already confirmed" }, { status: 200 });
  }

  // 2. Mark order as confirmed
  const { error: updateOrderErr } = await admin
    .from("orders")
    .update({ status: "confirmed" })
    .eq("id", orderId);

  if (updateOrderErr) {
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }

  // 3. Decrement stock for each item
  if (!order.menu_id) {
    return NextResponse.json({ success: true, stockUpdated: false });
  }

  const { data: menu, error: menuErr } = await admin
    .from("menus")
    .select("items")
    .eq("id", order.menu_id)
    .single();

  if (menuErr || !menu) {
    // Non-critical — order is already confirmed, just skip stock update
    return NextResponse.json({ success: true, stockUpdated: false });
  }

  const menuItems: MenuItem[] = Array.isArray(menu.items) ? menu.items : [];
  const orderedItems: { id: string; quantity: number }[] = Array.isArray(order.items)
    ? order.items
    : [];

  let changed = false;
  const updatedItems = menuItems.map((menuItem) => {
    const ordered = orderedItems.find((o) => o.id === menuItem.id);
    if (!ordered) return menuItem;

    // Only decrement if stock_count is a non-null number
    if (typeof menuItem.stock_count !== "number" || menuItem.stock_count === null) {
      return menuItem;
    }

    const newStock = Math.max(0, menuItem.stock_count - ordered.quantity);
    changed = true;

    return {
      ...menuItem,
      stock_count: newStock,
      // Auto sold-out when stock hits zero
      available: newStock > 0 ? menuItem.available : false,
    };
  });

  if (changed) {
    await admin
      .from("menus")
      .update({ items: updatedItems })
      .eq("id", order.menu_id);
  }

  // Fire order notification email (fire-and-forget — don't block the response)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const cronSecret = process.env.CRON_SECRET;
  if (siteUrl) {
    const notifItems = orderedItems
      .map((o) => {
        const mi = menuItems.find((m) => m.id === o.id);
        return mi ? { name: mi.name, quantity: o.quantity, price: mi.price } : null;
      })
      .filter(Boolean);

    const total = notifItems.reduce((sum, i) => sum + i!.price * i!.quantity, 0);

    const fullOrder = order as Record<string, unknown>;
    fetch(`${siteUrl}/api/notifications/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId,
        items: notifItems,
        total,
        currency: fullOrder.currency ?? "RWF",
        customerName: fullOrder.customer_name ?? null,
        customerEmail: fullOrder.customer_email ?? null,
        tableNumber: fullOrder.table_number ?? null,
      }),
    }).catch((e) => console.error("Order notification failed:", e));

    const itemCount = orderedItems.length;
    fetch(`${siteUrl}/api/push/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
      },
      body: JSON.stringify({
        restaurantId,
        title: "Order Ready",
        body: `${itemCount} item${itemCount !== 1 ? "s" : ""} marked ready for pickup`,
        url: "/dashboard/orders",
      }),
    }).catch((e) => console.error("Push notification failed:", e));
  }

  return NextResponse.json({ success: true, stockUpdated: changed });
}
