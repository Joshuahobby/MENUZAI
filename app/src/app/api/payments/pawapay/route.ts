import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { phoneNumber, plan, amount } = await req.json();

    // 1. Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get restaurant ID for this user
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // 2. Generate a unique deposit ID for this transaction
    const depositId = `dep_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Detect correspondent from Rwanda phone prefix
    const localNumber = phoneNumber.replace(/^250/, "");
    const correspondent = localNumber.startsWith("72") || localNumber.startsWith("73")
      ? "AIRTEL_OAPI_RWA"
      : "MTN_MOMO_RWA";

    // 3. Prepare payload for pawaPay
    const pawapayPayload = {
      depositId: depositId,
      amount: amount.toString(),
      currency: "RWF",
      country: "RWA",
      correspondent,
      payer: {
        type: "MSISDN",
        address: { value: phoneNumber }
      },
      customerTimestamp: new Date().toISOString(),
      statementDescription: `MENUZA AI ${plan} Plan`,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/pawapay`,
    };

    // 4. Call pawaPay API
    const baseUrl = process.env.PAWAPAY_BASE_URL ??
      (process.env.PAWAPAY_MODE === "sandbox"
        ? "https://api.sandbox.pawapay.io"
        : "https://api.pawapay.io");
    const pawaPayUrl = `${baseUrl}/v1/deposits`;

    // 5. Store pending transaction in our database (admin client bypasses RLS insert gap)
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error("Server configuration error.");
    const { error: dbError } = await admin.from('transactions').insert({
      deposit_id: depositId, 
      user_id: user.id, 
      restaurant_id: restaurant.id,
      status: 'pending', 
      amount: amount,
      currency: "RWF",
      plan_name: plan
    });

    if (dbError) {
      console.error("DB Error:", dbError);
      throw new Error("Failed to record transaction. Please try again.");
    }

    // 6. Initiate Payment with pawaPay
    if (process.env.PAWAPAY_API_KEY) {
      const response = await fetch(pawaPayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PAWAPAY_API_KEY}`
        },
        body: JSON.stringify(pawapayPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Update transaction status to failed if initiation failed
        await admin.from('transactions').update({ status: 'failed' }).eq('deposit_id', depositId);
        throw new Error(errorData.message || "Failed to initiate payment with pawaPay");
      }

      const pawaPayData = await response.json();
      return NextResponse.json({ 
        success: true, 
        depositId, 
        externalId: pawaPayData.externalId,
        message: "Payment initiated. Please check your phone for the MoMo prompt." 
      });
    } else {
      // Fallback for simulation if JWT is missing (should not happen in prod)
      return NextResponse.json({ 
        success: true, 
        depositId, 
        simulated: true,
        message: "Payment simulated (PAWAPAY_API_KEY missing). Transaction recorded as pending." 
      });
    }

  } catch (error: unknown) {
    console.error("Payment initiation error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}