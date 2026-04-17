import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Tell Next.js to always run this route dynamically and skip static collection during build
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Build-time safety check: if admin client failed to initialize (e.g. during Vercel static analysis)
    if (!supabaseAdmin) {
      console.error("Supabase Admin client not initialized. Check environment variables.");
      return NextResponse.json({ error: "Internal Server Error (Configuration)" }, { status: 500 });
    }

    const payload = await req.json();

    // 1. Verify pawaPay Signature (IMPORTANT FOR PRODUCTION)
    // You should verify the request came from pawaPay using the X-Pawapay-Signature header.

    const { depositId, status, amount } = payload;

    // 2. Fetch the transaction from the database
    const { data: tx, error: txError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("deposit_id", depositId)
      .single();

    if (txError || !tx) {
      console.error("Transaction not found for depositId:", depositId);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // 3. Handle status updates
    if (status === "COMPLETED") {
      // Update transaction status
      await supabaseAdmin
        .from("transactions")
        .update({ status: "completed" })
        .eq("deposit_id", depositId);

      // Upgrade restaurant plan
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

    // Always return 200 OK to acknowledge receipt of the webhook, otherwise pawaPay will retry
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("pawaPay Webhook Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}