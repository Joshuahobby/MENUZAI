import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { headers } from "next/headers";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 5 * 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: Request) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
  }
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
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}