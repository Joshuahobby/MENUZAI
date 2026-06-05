import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { isPlatformAdmin } from "@/lib/utils";

export const dynamic = "force-dynamic";

const RESEND_FROM = process.env.RESEND_FROM_EMAIL ?? "welcome@menuzaai.com";

type Segment = "all" | "trial" | "free" | "pro" | "business";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isPlatformAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 422 });
    }

    const { subject, html, segment } = await req.json() as { subject: string; html: string; segment: Segment };
    if (!subject?.trim() || !html?.trim() || !segment) {
      return NextResponse.json({ error: "subject, html, and segment are required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });

    // Fetch matching restaurants
    let query = admin.from("restaurants").select("id, user_id, plan, trial_ends_at");
    if (segment === "pro") query = query.eq("plan", "pro");
    else if (segment === "business") query = query.eq("plan", "business");
    else if (segment === "free") query = query.eq("plan", "free").is("trial_ends_at", null);
    else if (segment === "trial") {
      const now = new Date().toISOString();
      query = query.eq("plan", "free").gt("trial_ends_at", now);
    }

    const { data: restaurants } = await query;
    if (!restaurants?.length) {
      return NextResponse.json({ sent: 0, segment, subject });
    }

    // Resolve owner emails and send
    let sent = 0;
    for (const r of restaurants) {
      const { data: { user: owner } } = await admin.auth.admin.getUserById(r.user_id);
      const email = owner?.email;
      if (!email) continue;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${resendKey}` },
        body: JSON.stringify({ from: `MENUZA AI <${RESEND_FROM}>`, to: [email], subject, html }),
      }).catch((e) => console.error(`Broadcast email failed to ${email}:`, e));
      sent++;
    }

    // Write audit log (non-blocking)
    void Promise.resolve(
      admin.from("admin_audit_log").insert({
        action: "broadcast_email",
        performed_by: user.email!,
        new_value: { subject, segment, recipients: sent },
      })
    ).catch((e: unknown) => console.warn("audit log insert failed", e));

    return NextResponse.json({ sent, segment, subject });
  } catch (err) {
    console.error("admin/broadcast error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
