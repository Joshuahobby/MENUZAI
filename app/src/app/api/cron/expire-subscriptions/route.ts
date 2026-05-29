import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Configuration missing" }, { status: 500 });

  const now = new Date().toISOString();

  // Expire paid subscriptions whose plan_expires_at has passed.
  // Trial expiry is no longer handled here — trial state is derived from trial_ends_at
  // being in the future; the plan column is already 'free' for all trial users.
  const paidResult = await admin
    .from("restaurants")
    .update({ plan: "free", plan_expires_at: null })
    .lt("plan_expires_at", now)
    .neq("plan", "free")
    .select("id");

  if (paidResult.error) console.error("expire-subscriptions paid error:", paidResult.error);

  const downgraded = paidResult.data?.length ?? 0;
  console.log(`expire-subscriptions: downgraded ${downgraded} restaurant(s) to free`);
  return NextResponse.json({ downgraded });
}
