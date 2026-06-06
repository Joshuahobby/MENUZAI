import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { restaurantId, items, total, currency, customerName, customerEmail, tableNumber } = await req.json();

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

    const ownerHtml = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1c1c1e">
        <div style="background:#FF6B00;padding:24px 32px;border-radius:16px 16px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">🍽️ New Order — ${restaurant.name}</h1>
        </div>
        <div style="background:#fff;padding:24px 32px;border:1px solid #e5e5ea;border-top:none;border-radius:0 0 16px 16px">
          ${customerName ? `<p><strong>Customer:</strong> ${customerName}</p>` : ""}
          ${customerEmail ? `<p><strong>Email:</strong> ${customerEmail}</p>` : ""}
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

    const customerHtml = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1c1c1e">
        <div style="background:#FF6B00;padding:24px 32px;border-radius:16px 16px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">🧾 Order Receipt from ${restaurant.name}</h1>
        </div>
        <div style="background:#fff;padding:24px 32px;border:1px solid #e5e5ea;border-top:none;border-radius:0 0 16px 16px">
          <p>Hi ${customerName || "there"},</p>
          <p>Thank you for your order! Here is a summary of what you ordered from <strong>${restaurant.name}</strong>.</p>
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
          <p style="font-size:12px;color:#888;margin-top:24px">Sent by MENUZA AI on behalf of ${restaurant.name}.</p>
        </div>
      </div>`;

    const sendEmail = async (to: string, subject: string, html: string) => {
      return fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `MENUZA AI <${process.env.RESEND_FROM_EMAIL ?? "hello@menuzaai.com"}>`,
          to: [to],
          subject,
          html,
        }),
      });
    };

    const promises = [
      sendEmail(
        ownerEmail,
        `New order${customerName ? ` from ${customerName}` : ""} — ${restaurant.name}`,
        ownerHtml
      )
    ];

    if (customerEmail) {
      promises.push(
        sendEmail(
          customerEmail,
          `Your Order Receipt — ${restaurant.name}`,
          customerHtml
        )
      );
    }

    const results = await Promise.allSettled(promises);
    const anyFailed = results.some(r => r.status === "rejected" || (r.status === "fulfilled" && !r.value.ok));

    if (anyFailed) {
      console.error("Some or all emails failed to send", results);
      return NextResponse.json({ sent: true, partialSuccess: true });
    }

    return NextResponse.json({ sent: true });

  } catch (err: unknown) {
    console.error("Notification route error:", err);
    return NextResponse.json({ 
      error: "Internal server error",
      details: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
