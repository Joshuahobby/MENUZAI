import { NextResponse } from "next/server";
import { createVerify } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const publicKey = process.env.PAWAPAY_WEBHOOK_PUBLIC_KEY;
  if (!publicKey || !signatureHeader) return false;
  try {
    const verify = createVerify("SHA256");
    verify.update(rawBody);
    // PawaPay sends signature as base64
    return verify.verify(publicKey, signatureHeader, "base64");
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      console.error("Supabase Admin client not initialized. Check environment variables.");
      return NextResponse.json({ error: "Internal Server Error (Configuration)" }, { status: 500 });
    }

    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-pawapay-signature");

    if (!verifySignature(rawBody, signatureHeader)) {
      console.error("pawaPay webhook signature verification failed.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { depositId, status } = payload;

    const { data: tx, error: txError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("deposit_id", depositId)
      .single();

    if (txError || !tx) {
      console.error("Transaction not found for depositId:", depositId);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (status === "COMPLETED") {
      await supabaseAdmin
        .from("transactions")
        .update({ status: "completed" })
        .eq("deposit_id", depositId);

      // Handle food order payments separately from plan upgrades
      if ((tx.plan_name as string | null)?.toLowerCase() === "food_order") {
        await supabaseAdmin
          .from("orders")
          .update({ paid: true, status: "pending" })
          .eq("payment_deposit_id", depositId);
        console.log(`✅ Food order payment completed: ${depositId}`);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const planName = (tx.plan_name as string | null)?.toLowerCase() ?? "pro";

      const isAnnualPlan = (tx.plan_name as string ?? "").toLowerCase().includes("annual");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (isAnnualPlan ? 365 : 30));

      const [{ error: upgradeError }, { data: restaurant }, { data: { user } }] = await Promise.all([
        supabaseAdmin
          .from("restaurants")
          .update({ plan: planName, plan_expires_at: expiresAt.toISOString() })
          .eq("id", tx.restaurant_id),
        supabaseAdmin.from("restaurants").select("name").eq("id", tx.restaurant_id).single(),
        supabaseAdmin.auth.admin.getUserById(tx.user_id),
      ]);

      if (upgradeError) {
        console.error("Failed to upgrade restaurant plan:", upgradeError);
      } else {
        console.log(`✅ Restaurant ${tx.restaurant_id} upgraded to ${planName}`);
      }

      // Send upgrade confirmation email
      const ownerEmail = user?.email;
      if (ownerEmail && process.env.RESEND_API_KEY) {
        const planLabel = planName.charAt(0).toUpperCase() + planName.slice(1);
        const restaurantName = restaurant?.name ?? "your restaurant";
        const html = `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1c1c1e">
            <div style="background:#FF6B00;padding:24px 32px;border-radius:16px 16px 0 0">
              <h1 style="color:white;margin:0;font-size:20px">You're now on ${planLabel} — ${restaurantName}</h1>
            </div>
            <div style="background:#fff;padding:24px 32px;border:1px solid #e5e5ea;border-top:none;border-radius:0 0 16px 16px">
              <p style="font-size:16px">Your payment was successful and your account has been upgraded to the <strong>${planLabel} plan</strong>.</p>
              <p>You now have access to:</p>
              <ul style="line-height:2">
                ${planName === "pro" ? "<li>Unlimited menus</li><li>Custom branded QR codes</li><li>Live analytics</li><li>WhatsApp ordering</li>" : "<li>All Pro features</li><li>Multi-location admin</li><li>Priority support</li>"}
              </ul>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#FF6B00;color:white;font-weight:bold;border-radius:12px;text-decoration:none">Open Dashboard</a>
              <p style="font-size:12px;color:#888;margin-top:24px">Sent by MENUZA AI · Questions? Reply to this email.</p>
            </div>
          </div>`;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: `MENUZA AI <${process.env.RESEND_FROM_EMAIL ?? "hello@menuzaai.com"}>`,
            to: [ownerEmail],
            subject: `Your ${planLabel} plan is now active${isAnnualPlan ? " (Annual)" : ""} — MENUZA AI`,
            html,
          }),
        }).catch((e) => console.error("Upgrade email failed:", e));
      }
    } else if (status === "FAILED") {
      await supabaseAdmin
        .from("transactions")
        .update({ status: "failed" })
        .eq("deposit_id", depositId);
      console.log(`❌ pawaPay payment ${depositId} marked as failed`);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: unknown) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
