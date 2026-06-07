import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // Delete restaurant rows (RLS bypass). Supabase cascades to child tables
  // (menus, orders, reviews, analytics_events etc.) via FK ON DELETE CASCADE.
  const { error: delError } = await admin
    .from("restaurants")
    .delete()
    .eq("user_id", user.id);

  if (delError) {
    return NextResponse.json({ error: "Failed to delete account data" }, { status: 500 });
  }

  // Delete the auth user — this also removes sessions and any storage objects
  // owned by the user identity.
  const { error: userDelError } = await admin.auth.admin.deleteUser(user.id);
  if (userDelError) {
    console.error("Account delete user error:", userDelError.message);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
