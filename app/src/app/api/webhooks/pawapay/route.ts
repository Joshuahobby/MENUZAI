import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    // We need the service role key to bypass RLS and update the user's plan via webhook
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy"
    );

    const payload = await req.json();

    // 1. Verify pawaPay Signature (IMPORTANT FOR PRODUCTION)
    // You should verify the request came from pawaPay using the X-Pawapay-Signature header.

    const { depositId, status, amount } = payload;

    // 2. Check if payment was successful
    if (status === "COMPLETED") {
      // 3. Find the user associated with this depositId (Assuming you saved it in a transactions table)
      // For this example, let's assume the payload includes metadata or we look it up
      // const { data: tx } = await supabaseAdmin.from('transactions').select('*').eq('deposit_id', depositId).single();
      
      // 4. Update the restaurant's plan to 'pro'
      // Example:
      // await supabaseAdmin
      //   .from("restaurants")
      //   .update({ plan: "pro" })
      //   .eq("user_id", tx.user_id);

      console.log(`✅ pawaPay payment ${depositId} successful for ${amount}`);
    } else if (status === "FAILED") {
      console.log(`❌ pawaPay payment ${depositId} failed`);
      // Update transaction status to failed
    }

    // Always return 200 OK to acknowledge receipt of the webhook, otherwise pawaPay will retry
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("pawaPay Webhook Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}