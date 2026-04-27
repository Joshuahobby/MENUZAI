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

      const planName = (tx.plan_name as string | null)?.toLowerCase() ?? "pro";

      const { error: upgradeError } = await supabaseAdmin
        .from("restaurants")
        .update({ plan: planName })
        .eq("id", tx.restaurant_id);

      if (upgradeError) {
        console.error("Failed to upgrade restaurant plan:", upgradeError);
      } else {
        console.log(`✅ Restaurant ${tx.restaurant_id} upgraded to ${planName}`);
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
