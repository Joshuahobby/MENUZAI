import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const depositId = searchParams.get("depositId");

  if (!depositId) {
    return NextResponse.json({ error: "Missing depositId" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Configuration missing" }, { status: 500 });

  const { data: tx, error } = await admin
    .from("transactions")
    .select("status, plan_name")
    .eq("deposit_id", depositId)
    .eq("user_id", user.id)
    .single();

  if (error || !tx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  return NextResponse.json({ status: tx.status, plan: tx.plan_name });
}
