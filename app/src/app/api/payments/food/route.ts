import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { restaurantId, menuId, items, total, phone, tableNumber, customerName } = await req.json() as {
      restaurantId: string;
      menuId: string;
      items: unknown[];
      total: number;
      phone: string;
      tableNumber?: string | null;
      customerName?: string | null;
    };

    if (!restaurantId || !menuId || !items?.length || !(total > 0) || !phone?.trim()) {
      return NextResponse.json({ error: "restaurantId, menuId, items, total, and phone are required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "Server configuration error" }, { status: 500 });

    // Verify restaurant has payments enabled
    const { data: restaurant } = await admin
      .from("restaurants")
      .select("id, user_id, payments_enabled, name")
      .eq("id", restaurantId)
      .single();

    if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    if (!restaurant.payments_enabled) {
      return NextResponse.json({ error: "Online payments are not enabled for this restaurant" }, { status: 403 });
    }

    // Server-side price, item, and currency validation — never trust client input
    const { data: menu } = await admin
      .from("menus")
      .select("items, style, status")
      .eq("id", menuId)
      .eq("restaurant_id", restaurantId)
      .single();

    if (!menu) return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    if (menu.status !== "published") {
      return NextResponse.json({ error: "Menu is not available for ordering" }, { status: 403 });
    }

    // Currency comes from the menu's own style config, never from the client
    const menuCurrency: string = (menu.style as { currency?: string } | null)?.currency ?? "RWF";

    type OrderedItem = { id: string; quantity: number };
    const menuItemPrices: Record<string, number> = {};
    for (const mi of (menu.items as { id: string; price: number }[] ?? [])) {
      menuItemPrices[mi.id] = mi.price;
    }

    const orderedItems = items as OrderedItem[];

    // Validate each ordered item: must exist in menu and have a positive integer quantity
    for (const o of orderedItems) {
      if (!(o.id in menuItemPrices)) {
        return NextResponse.json({ error: `Item not found in menu: ${o.id}` }, { status: 400 });
      }
      const qty = Number(o.quantity);
      if (!Number.isInteger(qty) || qty < 1) {
        return NextResponse.json({ error: "Item quantities must be positive whole numbers" }, { status: 400 });
      }
    }

    const calculatedTotal = orderedItems.reduce((sum, o) => {
      return sum + menuItemPrices[o.id] * o.quantity;
    }, 0);

    if (calculatedTotal <= 0) {
      return NextResponse.json({ error: "Could not calculate order total from menu prices" }, { status: 400 });
    }
    // Allow ±1 unit rounding tolerance for display vs stored price differences
    if (Math.abs(calculatedTotal - total) > 1) {
      return NextResponse.json({ error: "Order total does not match menu prices" }, { status: 400 });
    }

    // Create order with pending_payment status
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        menu_id: menuId,
        restaurant_id: restaurantId,
        items,
        total: calculatedTotal,
        customer_name: customerName ?? null,
        table_number: tableNumber ?? null,
        whatsapp_sent: false,
        status: "pending_payment",
        paid: false,
        source: "whatsapp",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Food payment: failed to create order", orderError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    const depositId = `food_${crypto.randomUUID()}`;

    // Update order with the deposit ID
    await admin.from("orders").update({ payment_deposit_id: depositId }).eq("id", order.id);

    // Detect correspondent from phone number
    const localNumber = phone.replace(/^\+?250/, "");
    const correspondent = localNumber.startsWith("72") || localNumber.startsWith("73")
      ? "AIRTEL_OAPI_RWA"
      : "MTN_MOMO_RWA";

    // Record pending transaction
    const { error: txError } = await admin.from("transactions").insert({
      deposit_id: depositId,
      user_id: restaurant.user_id,
      restaurant_id: restaurantId,
      status: "pending",
      amount: calculatedTotal,
      currency: menuCurrency,
      plan_name: "food_order",
    });

    if (txError) {
      console.error("Food payment: failed to record transaction", txError);
      await admin.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
    }

    // Call PawaPay if API key is configured
    if (process.env.PAWAPAY_API_KEY) {
      const baseUrl = process.env.PAWAPAY_BASE_URL ??
        (process.env.PAWAPAY_MODE === "sandbox"
          ? "https://api.sandbox.pawapay.io/v1"
          : "https://api.pawapay.io/v1");

      const pawapayPayload = {
        depositId,
        amount: calculatedTotal.toString(),
        currency: menuCurrency,
        country: "RWA",
        correspondent,
        payer: { type: "MSISDN", address: { value: phone } },
        customerTimestamp: new Date().toISOString(),
        statementDescription: `Order at ${restaurant.name ?? "MENUZA AI"}`,
        callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/pawapay`,
      };

      const response = await fetch(`${baseUrl}/deposits`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.PAWAPAY_API_KEY}` },
        body: JSON.stringify(pawapayPayload),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("PawaPay food payment error:", response.status, text);
        await Promise.all([
          admin.from("transactions").update({ status: "failed" }).eq("deposit_id", depositId),
          admin.from("orders").delete().eq("id", order.id),
        ]);
        return NextResponse.json({ error: "Payment initiation failed. Please try again." }, { status: 502 });
      }
    }

    return NextResponse.json({ depositId, orderId: order.id, simulated: !process.env.PAWAPAY_API_KEY });
  } catch (err) {
    console.error("food payment error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
