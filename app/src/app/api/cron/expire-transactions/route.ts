import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET is not set — cron endpoint is disabled");
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
  }

  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("transactions")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .select("deposit_id");

  if (error) {
    console.error("Failed to expire transactions:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const expired = data?.length ?? 0;
  if (expired > 0) console.log(`Expired ${expired} stale transaction(s).`);

  return NextResponse.json({ expired });
}
