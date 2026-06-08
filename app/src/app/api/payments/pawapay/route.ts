import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";

const FALLBACK_PRICES = { pro: 35_000, business: 89_000 };

async function resolvePlanPrices(): Promise<Record<string, number>> {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return buildPriceMap(FALLBACK_PRICES);
    const { data } = await admin
      .from("platform_settings")
      .select("plan_prices")
      .eq("id", "global")
      .single();
    const p = (data?.plan_prices as typeof FALLBACK_PRICES | null) ?? FALLBACK_PRICES;
    return buildPriceMap({ pro: p.pro ?? FALLBACK_PRICES.pro, business: p.business ?? FALLBACK_PRICES.business });
  } catch {
    return buildPriceMap(FALLBACK_PRICES);
  }
}

function buildPriceMap(p: { pro: number; business: number }): Record<string, number> {
  return {
    pro: p.pro,
    business: p.business,
    "pro (monthly)": p.pro,
    "business (monthly)": p.business,
    "pro (annual)": p.pro * 11,
    "business (annual)": p.business * 11,
  };
}

export async function POST(req: Request) {
  try {
    const { phoneNumber, plan } = await req.json();

    const planKey = plan?.toLowerCase() ?? "";
    const PLAN_PRICES = await resolvePlanPrices();
    const amount = PLAN_PRICES[planKey];
    if (!amount) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    const isAnnual = planKey.includes("annual");

    // 1. Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!await checkRateLimit(user.id, { id: "payments-pawapay", max: 3, windowMs: 5 * 60_000 })) {
      return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
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
    const depositId = `dep_${crypto.randomUUID()}`;

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
    // PAWAPAY_BASE_URL should already include the version path (e.g. /v1 or /v2)
    const baseUrl = process.env.PAWAPAY_BASE_URL ??
      (process.env.PAWAPAY_MODE === "sandbox"
        ? "https://api.sandbox.pawapay.io/v1"
        : "https://api.pawapay.io/v1");
    const pawaPayUrl = `${baseUrl}/deposits`;

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
        const errorText = await response.text();
        console.error("PawaPay error response:", response.status, errorText);
        await admin.from('transactions').update({ status: 'failed' }).eq('deposit_id', depositId);
        let errorMsg = "Failed to initiate payment with pawaPay";
        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.message || errorData.errorMessage || errorData.description || errorMsg;
        } catch { /* non-JSON response */ }
        throw new Error(errorMsg);
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}