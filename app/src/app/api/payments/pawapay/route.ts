import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; // We'll need a service role key for admin tasks later, but standard is fine for reading auth

export async function POST(req: Request) {
  try {
    const { phoneNumber, plan, amount } = await req.json();

    // 1. Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    // Note: This requires PAWAPAY_JWT in your .env.local
    const pawaPayUrl = process.env.NODE_ENV === "production" 
      ? "https://api.pawapay.io/v1/deposits" 
      : "https://api.sandbox.pawapay.io/v1/deposits";

    /* 
    // UNCOMMENT WHEN YOU HAVE API KEYS
    const response = await fetch(pawaPayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${process.env.PAWAPAY_JWT}\`
      },
      body: JSON.stringify(pawapayPayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to initiate payment with pawaPay");
    }
    */

    // 5. Store pending transaction in our database (Optional but recommended)
    // await supabaseAdmin.from('transactions').insert({ deposit_id: depositId, user_id: user.id, status: 'pending', plan });

    // For now, simulate success response
    return NextResponse.json({ 
      success: true, 
      depositId, 
      message: "Payment initiated. Please check your phone for the MoMo prompt." 
    });

  } catch (error: any) {
    console.error("pawaPay Error:", error);
    return NextResponse.json({ error: error.message || "Payment initiation failed" }, { status: 500 });
  }
}