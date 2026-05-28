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

  // Match restaurants expiring on exactly the same calendar day as now()+3 days.
  // The daily cron guarantees this fires once per restaurant.
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 3);
  const targetDay = targetDate.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const { data: expiring, error } = await admin
    .from("restaurants")
    .select("id, name, user_id, plan")
    .gte("plan_expires_at", `${targetDay}T00:00:00Z`)
    .lt("plan_expires_at", `${targetDay}T23:59:59Z`)
    .neq("plan", "free");

  if (error) {
    console.error("remind-subscriptions query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also find trials expiring in 2 days (day 12 of 14 = first noticeable warning)
  const trialTargetDate = new Date();
  trialTargetDate.setDate(trialTargetDate.getDate() + 2);
  const trialTargetDay = trialTargetDate.toISOString().slice(0, 10);

  const { data: expiringTrials } = await admin
    .from("restaurants")
    .select("id, name, user_id, plan")
    .eq("plan", "trial")
    .gte("trial_ends_at", `${trialTargetDay}T00:00:00Z`)
    .lt("trial_ends_at", `${trialTargetDay}T23:59:59Z`);

  const allExpiring = [...(expiring ?? []), ...(expiringTrials ?? [])];

  if (!allExpiring.length) {
    return NextResponse.json({ reminded: 0 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://menuzai.com";
  let reminded = 0;

  for (const restaurant of allExpiring) {
    const { data: { user } } = await admin.auth.admin.getUserById(restaurant.user_id);
    const email = user?.email;
    if (!email || !resendKey) continue;

    const isTrial = restaurant.plan === "trial";
    const accentColor = isTrial ? "#7c3aed" : "#FF6B00";
    const subject = isTrial
      ? "Your free trial ends in 2 days — upgrade to keep your features"
      : `Renew your ${(restaurant.plan as string).charAt(0).toUpperCase() + (restaurant.plan as string).slice(1)} plan — expires in 3 days`;
    const heading = isTrial ? "Your free trial ends in 2 days" : `Your plan expires in 3 days`;
    const body = isTrial
      ? `Your <strong>14-day free trial</strong> for <strong>${restaurant.name ?? "your restaurant"}</strong> ends in 2 days. Upgrade now to keep your AI Digital Waiter, unlimited menus, staff management, and all Pro features.`
      : `Your <strong>Pro plan</strong> for <strong>${restaurant.name ?? "your restaurant"}</strong> expires in 3 days. Renew now with a quick Mobile Money payment to avoid interruption.`;
    const ctaLabel = isTrial ? "Upgrade to Pro" : "Renew My Plan";

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1c1c1e">
        <div style="background:${accentColor};padding:24px 32px;border-radius:16px 16px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">${heading}</h1>
        </div>
        <div style="background:#fff;padding:24px 32px;border:1px solid #e5e5ea;border-top:none;border-radius:0 0 16px 16px">
          <p style="font-size:16px">Hi there,</p>
          <p>${body}</p>
          <a href="${siteUrl}/dashboard/settings" style="display:inline-block;margin-top:16px;padding:12px 28px;background:${accentColor};color:white;font-weight:bold;border-radius:12px;text-decoration:none">
            ${ctaLabel}
          </a>
          <p style="font-size:13px;color:#555;margin-top:24px">If you don't upgrade, your account will automatically switch to the Free plan and features like the AI Waiter and staff management will be paused.</p>
          <p style="font-size:12px;color:#888;margin-top:16px">Sent by MENUZA AI · Questions? Reply to this email.</p>
        </div>
      </div>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: `MENUZA AI <${process.env.RESEND_FROM_EMAIL ?? "orders@ikoranabuhanga.tech"}>`,
        to: [email],
        subject,
        html,
      }),
    }).catch((e) => console.error(`Reminder email failed for ${restaurant.id}:`, e));

    reminded++;
  }

  console.log(`remind-subscriptions: sent ${reminded} reminder(s)`);
  return NextResponse.json({ reminded });
}
