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

  const { data, error } = await admin
    .from("restaurants")
    .update({ plan: "free", plan_expires_at: null })
    .lt("plan_expires_at", new Date().toISOString())
    .neq("plan", "free")
    .select("id, plan_expires_at");

  if (error) {
    console.error("expire-subscriptions cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const count = data?.length ?? 0;
  console.log(`expire-subscriptions: downgraded ${count} restaurant(s) to free`);
  return NextResponse.json({ downgraded: count });
}
