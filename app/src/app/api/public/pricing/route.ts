import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { pricingPlans } from "@/data/mockData";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return new Intl.NumberFormat("en-RW").format(n);
}

function fallback() {
  return NextResponse.json(pricingPlans, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return fallback();

    const { data } = await admin
      .from("platform_settings")
      .select("plan_prices")
      .eq("id", "global")
      .single();

    const dbPrices = data?.plan_prices as { pro?: number; business?: number } | null;
    if (!dbPrices) return fallback();

    const updated = pricingPlans.map(plan => {
      const key = plan.name.toLowerCase() as "pro" | "business";
      const dbPrice = dbPrices[key];
      if (!dbPrice) return plan;
      return { ...plan, price: `${fmt(dbPrice)} RWF`, amountRwf: dbPrice };
    });

    return NextResponse.json(updated, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return fallback();
  }
}
