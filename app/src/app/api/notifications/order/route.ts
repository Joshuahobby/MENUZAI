import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { restaurantId, items, total, currency, customerName, tableNumber } = await req.json();

    if (!restaurantId || !items || total == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // If no Resend API key is configured, silently skip (don't block the order flow)
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ sent: false, reason: "RESEND_API_KEY not configured" });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ sent: false, reason: "Admin client unavailable" });
    }

    // Get restaurant + owner email
    const { data: restaurant } = await supabaseAdmin
      .from("restaurants")
      .select("name, user_id")
      .eq("id", restaurantId)
      .single();

    if (!restaurant) {
      return NextResponse.json({ sent: false, reason: "Restaurant not found" });
    }

    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(restaurant.user_id);
    const ownerEmail = user?.email;

    if (!ownerEmail) {
      return NextResponse.json({ sent: false, reason: "Owner email not found" });
    }

    const itemLines = (items as { name: string; quantity: number; price: number }[])
      .map(i => `<tr><td style="padding:6px 12px">${i.name}</td><td style="padding:6px 12px;text-align:center">×${i.quantity}</td><td style="padding:6px 12px;text-align:right">${i.price * i.quantity} ${currency ?? "RWF"}</td></tr>`)
      .join("");

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1c1c1e">
        <div style="background:#FF6B00;padding:24px 32px;border-radius:16px 16px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">🍽️ New Order — ${restaurant.name}</h1>
        </div>
        <div style="background:#fff;padding:24px 32px;border:1px solid #e5e5ea;border-top:none;border-radius:0 0 16px 16px">
          ${customerName ? `<p><strong>Customer:</strong> ${customerName}</p>` : ""}
          ${tableNumber ? `<p><strong>Table:</strong> ${tableNumber}</p>` : ""}
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <thead><tr style="background:#f5f5f7;font-size:12px;text-transform:uppercase;letter-spacing:.05em">
              <th style="padding:8px 12px;text-align:left">Item</th>
              <th style="padding:8px 12px;text-align:center">Qty</th>
              <th style="padding:8px 12px;text-align:right">Price</th>
            </tr></thead>
            <tbody>${itemLines}</tbody>
            <tfoot><tr style="border-top:2px solid #e5e5ea;font-weight:bold">
              <td colspan="2" style="padding:10px 12px">Total</td>
              <td style="padding:10px 12px;text-align:right;color:#FF6B00">${total} ${currency ?? "RWF"}</td>
            </tr></tfoot>
          </table>
          <p style="font-size:12px;color:#888;margin-top:24px">Sent by MENUZA AI · Reply to this email or open your dashboard to manage orders.</p>
        </div>
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "MENUZA AI <orders@notifications.menuzaai.com>",
        to: [ownerEmail],
        subject: `New order${customerName ? ` from ${customerName}` : ""} — ${restaurant.name}`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Resend error:", err);
      return NextResponse.json({ sent: false, reason: "Email send failed" });
    }

    return NextResponse.json({ sent: true });

  } catch (error: any) {
    console.error("Order notification error:", error);
    return NextResponse.json({ sent: false, reason: error.message }, { status: 500 });
  }
}
