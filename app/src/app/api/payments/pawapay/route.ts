import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

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

    // 3. Prepare payload for pawaPay
    // Documentation: https://docs.pawapay.io/docs/pawapay-docs/api-reference/deposits
    const pawapayPayload = {
      depositId: depositId,
      amount: amount.toString(),
      currency: "RWF", // Replace with dynamic currency if operating in multiple countries
      country: "RWA", // Rwanda
      correspondent: "MTN_MOMO_RWA", // Defaulting to MTN Rwanda for this example. We can make this dynamic.
      payer: {
        type: "MSISDN",
        address: { value: phoneNumber }
      },
      customerTimestamp: new Date().toISOString(),
      statementDescription: `MENUZA AI ${plan} Plan`,
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`
    };

    // 4. Call pawaPay API
    const isProduction = process.env.NODE_ENV === "production" || process.env.PAWAPAY_JWT?.startsWith("pk_");
    const pawaPayUrl = isProduction 
      ? "https://api.pawapay.io/v1/deposits" 
      : "https://api.sandbox.pawapay.io/v1/deposits";

    // 5. Store pending transaction in our database
    const { error: dbError } = await supabase.from('transactions').insert({ 
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
    if (process.env.PAWAPAY_JWT) {
      const response = await fetch(pawaPayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.PAWAPAY_JWT}`
        },
        body: JSON.stringify(pawapayPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Update transaction status to failed if initiation failed
        await supabase.from('transactions').update({ status: 'failed' }).eq('deposit_id', depositId);
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
        message: "Payment simulated (PAWAPAY_JWT missing). Transaction recorded as pending." 
      });
    }

  } catch (error: any) {
    console.error("pawaPay Error:", error);
    return NextResponse.json({ error: error.message || "Payment initiation failed" }, { status: 500 });
  }
}