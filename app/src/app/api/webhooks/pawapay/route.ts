import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.PAWAPAY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
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

      const { error: upgradeError } = await supabaseAdmin
        .from("restaurants")
        .update({ plan: tx.plan_name || "pro" })
        .eq("id", tx.restaurant_id);

      if (upgradeError) {
        console.error("Failed to upgrade restaurant plan:", upgradeError);
      } else {
        console.log(`✅ Restaurant ${tx.restaurant_id} upgraded to ${tx.plan_name}`);
      }
    } else if (status === "FAILED") {
      await supabaseAdmin
        .from("transactions")
        .update({ status: "failed" })
        .eq("deposit_id", depositId);
      console.log(`❌ pawaPay payment ${depositId} marked as failed`);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("pawaPay Webhook Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
