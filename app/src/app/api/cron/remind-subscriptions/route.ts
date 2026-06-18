import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { startCronRun, completeCronRun } from "@/lib/cron-logger";

export const dynamic = "force-dynamic";

const RESEND_FROM = process.env.RESEND_FROM_EMAIL ?? "hello@menuzaai.com";

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

async function sendEmail(to: string, subject: string, html: string, resendKey: string) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${resendKey}` },
    body: JSON.stringify({ from: `MENUZA AI <${RESEND_FROM}>`, to: [to], subject, html }),
  }).catch((e) => console.error(`Email failed to ${to}:`, e));
}

function dayMatch(isoDate: string, daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}


export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not set — cron endpoint is disabled");
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Configuration missing" }, { status: 500 });

  const resendKey = process.env.RESEND_API_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://menuzaai.com";

  // ── Paid plan expiry reminder (3 days out) ─────────────────────────────
  const paidDay = dayMatch("", 3);
  const { data: expiringPaid } = await admin
    .from("restaurants")
    .select("id, name, user_id, plan")
    .gte("plan_expires_at", `${paidDay}T00:00:00Z`)
    .lt("plan_expires_at", `${paidDay}T23:59:59Z`)
    .neq("plan", "free")
    .neq("plan", "trial");

  // ── Trial: day-12 warning (2 days until expiry) ────────────────────────
  // trial users now have plan='free' with a non-null trial_ends_at
  const trial12Day = dayMatch("", 2);
  const { data: trialExpiring } = await admin
    .from("restaurants")
    .select("id, name, user_id, plan")
    .eq("plan", "free")
    .not("trial_ends_at", "is", null)
    .gte("trial_ends_at", `${trial12Day}T00:00:00Z`)
    .lt("trial_ends_at", `${trial12Day}T23:59:59Z`);

  // ── Trial: day-7 midpoint nudge (7 days until expiry) ─────────────────
  const trial7Day = dayMatch("", 7);
  const { data: trialMid } = await admin
    .from("restaurants")
    .select("id, name, user_id, plan")
    .eq("plan", "free")
    .not("trial_ends_at", "is", null)
    .gte("trial_ends_at", `${trial7Day}T00:00:00Z`)
    .lt("trial_ends_at", `${trial7Day}T23:59:59Z`);

  // ── Trial: day-1 welcome / get-started (13 days until expiry) ─────────
  const trial1Day = dayMatch("", 13);
  const { data: trialNew } = await admin
    .from("restaurants")
    .select("id, name, user_id, plan")
    .eq("plan", "free")
    .not("trial_ends_at", "is", null)
    .gte("trial_ends_at", `${trial1Day}T00:00:00Z`)
    .lt("trial_ends_at", `${trial1Day}T23:59:59Z`);

  const runId = await startCronRun("remind-subscriptions");

  let sent = 0;
  if (!resendKey) {
    console.warn("remind-subscriptions: RESEND_API_KEY not set, skipping emails");
    await completeCronRun(runId, 0, { reason: "no resend key" });
    return NextResponse.json({ sent: 0, reason: "no resend key" });
  }

  // Helper to get user email
  const getEmail = async (userId: string) => {
    const { data } = await admin.auth.admin.getUserById(userId);
    return data.user?.email ?? null;
  };

  // ── Send paid expiry reminders ─────────────────────────────────────────
  for (const r of expiringPaid ?? []) {
    const email = await getEmail(r.user_id);
    if (!email) continue;
    const planLabel = (r.plan as string).charAt(0).toUpperCase() + (r.plan as string).slice(1);
    await sendEmail(email, `Renew your ${planLabel} plan — expires in 3 days`, `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1c1c1e">
        <div style="background:#FF6B00;padding:24px 32px;border-radius:16px 16px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">Your ${planLabel} plan expires in 3 days</h1>
        </div>
        <div style="background:#fff;padding:24px 32px;border:1px solid #e5e5ea;border-top:none;border-radius:0 0 16px 16px">
          <p>Your <strong>${planLabel} plan</strong> for <strong>${esc(r.name) || "your restaurant"}</strong> expires in 3 days.</p>
          <p>Renew now with a quick Mobile Money payment to keep your AI Waiter and all Pro features running.</p>
          <a href="${siteUrl}/dashboard/settings" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#FF6B00;color:white;font-weight:bold;border-radius:12px;text-decoration:none">Renew My Plan</a>
          <p style="font-size:12px;color:#888;margin-top:24px">Sent by MENUZA AI · Reply with any questions.</p>
        </div>
      </div>`, resendKey);
    sent++;
  }

  // ── Send trial day-12 warning ──────────────────────────────────────────
  for (const r of trialExpiring ?? []) {
    const email = await getEmail(r.user_id);
    if (!email) continue;
    await sendEmail(email, "Your free trial ends in 2 days — upgrade to keep access", `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1c1c1e">
        <div style="background:#7c3aed;padding:24px 32px;border-radius:16px 16px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">Your free trial ends in 2 days</h1>
        </div>
        <div style="background:#fff;padding:24px 32px;border:1px solid #e5e5ea;border-top:none;border-radius:0 0 16px 16px">
          <p>Your 14-day trial for <strong>${esc(r.name) || "your restaurant"}</strong> ends in 2 days.</p>
          <p>Upgrade now to keep your AI Digital Waiter, unlimited menus, staff management, and live analytics.</p>
          <a href="${siteUrl}/dashboard/settings" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#7c3aed;color:white;font-weight:bold;border-radius:12px;text-decoration:none">Upgrade to Pro</a>
          <p style="font-size:13px;color:#555;margin-top:24px">After your trial, your account switches to the Free plan (1 menu, no AI features) unless you upgrade.</p>
          <p style="font-size:12px;color:#888;margin-top:16px">Sent by MENUZA AI · Reply with any questions.</p>
        </div>
      </div>`, resendKey);
    sent++;
  }

  // ── Send trial day-7 midpoint nudge ───────────────────────────────────
  for (const r of trialMid ?? []) {
    const email = await getEmail(r.user_id);
    if (!email) continue;
    await sendEmail(email, `How's your MENUZA AI trial going, ${esc(r.name)}?`.trim(), `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1c1c1e">
        <div style="background:#FF6B00;padding:24px 32px;border-radius:16px 16px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">You're halfway through your trial 🎉</h1>
        </div>
        <div style="background:#fff;padding:24px 32px;border:1px solid #e5e5ea;border-top:none;border-radius:0 0 16px 16px">
          <p>Hi there,</p>
          <p>You've had 7 days with MENUZA AI for <strong>${esc(r.name) || "your restaurant"}</strong>. Here are three things to make the most of your remaining 7 days:</p>
          <ol style="line-height:2;padding-left:20px">
            <li><strong>Share your QR code</strong> — put it on every table and let the AI Waiter greet your customers automatically.</li>
            <li><strong>Check your orders dashboard</strong> — see real-time orders come in and track your best-selling items.</li>
            <li><strong>Read your reviews</strong> — the AI drafts replies for you. One click to respond professionally.</li>
          </ol>
          <a href="${siteUrl}/dashboard" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#FF6B00;color:white;font-weight:bold;border-radius:12px;text-decoration:none">Open My Dashboard</a>

          <div style="margin-top:32px;border:2px solid #f5f5f7;border-radius:16px;overflow:hidden">
            <div style="background:#f5f5f7;padding:12px 20px">
              <p style="margin:0;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:#888">Your trial ends in 7 days — here&apos;s what you keep with Pro</p>
            </div>
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr>
                  <th style="padding:12px 20px;text-align:left;font-size:11px;color:#888;font-weight:700;border-bottom:1px solid #f0f0f0">Feature</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;color:#888;font-weight:700;border-bottom:1px solid #f0f0f0;background:#fff8f5">Free Lite</th>
                  <th style="padding:12px 16px;text-align:center;font-size:11px;color:#FF6B00;font-weight:900;border-bottom:1px solid #f0f0f0;background:#fff3ee">Pro ✓</th>
                </tr>
              </thead>
              <tbody style="font-size:12px">
                <tr style="border-bottom:1px solid #f8f8f8"><td style="padding:10px 20px">AI Digital Waiter (24/7)</td><td style="text-align:center;color:#ccc">✕</td><td style="text-align:center;color:#FF6B00;font-weight:bold;background:#fff3ee">✓</td></tr>
                <tr style="border-bottom:1px solid #f8f8f8"><td style="padding:10px 20px">Unlimited menus</td><td style="text-align:center;color:#ccc">✕</td><td style="text-align:center;color:#FF6B00;font-weight:bold;background:#fff3ee">✓</td></tr>
                <tr style="border-bottom:1px solid #f8f8f8"><td style="padding:10px 20px">Live analytics (90 days)</td><td style="text-align:center;color:#ccc">✕</td><td style="text-align:center;color:#FF6B00;font-weight:bold;background:#fff3ee">✓</td></tr>
                <tr style="border-bottom:1px solid #f8f8f8"><td style="padding:10px 20px">Real-time orders dashboard</td><td style="text-align:center;color:#ccc">✕</td><td style="text-align:center;color:#FF6B00;font-weight:bold;background:#fff3ee">✓</td></tr>
                <tr style="border-bottom:1px solid #f8f8f8"><td style="padding:10px 20px">Staff roles &amp; permissions</td><td style="text-align:center;color:#ccc">✕</td><td style="text-align:center;color:#FF6B00;font-weight:bold;background:#fff3ee">✓</td></tr>
                <tr><td style="padding:10px 20px">&quot;Powered by MENUZA AI&quot; branding</td><td style="text-align:center;color:#555">Shows</td><td style="text-align:center;color:#FF6B00;font-weight:bold;background:#fff3ee">Hidden</td></tr>
              </tbody>
            </table>
            <div style="background:#fff3ee;padding:16px 20px;text-align:center">
              <p style="margin:0 0 12px;font-size:15px;font-weight:900;color:#1c1c1e">35,000 RWF / month</p>
              <p style="margin:0 0 12px;font-size:11px;color:#888">Or 385,000 RWF / year — save 1 month free · Pay via Mobile Money</p>
              <a href="${siteUrl}/dashboard/settings" style="display:inline-block;padding:12px 32px;background:#FF6B00;color:white;font-weight:bold;border-radius:12px;text-decoration:none;font-size:13px">Upgrade to Pro Now</a>
            </div>
          </div>

          <p style="font-size:12px;color:#888;margin-top:24px">Sent by MENUZA AI · Questions? Just reply to this email.</p>
        </div>
      </div>`, resendKey);
    sent++;
  }

  // ── Send trial day-1 welcome / get-started ────────────────────────────
  for (const r of trialNew ?? []) {
    const email = await getEmail(r.user_id);
    if (!email) continue;
    await sendEmail(email, `Welcome to MENUZA AI — here's how to get your first order in 10 minutes`, `
      <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1c1c1e">
        <div style="background:#FF6B00;padding:24px 32px;border-radius:16px 16px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">Your 14-day trial has started 🚀</h1>
        </div>
        <div style="background:#fff;padding:24px 32px;border:1px solid #e5e5ea;border-top:none;border-radius:0 0 16px 16px">
          <p>Welcome to MENUZA AI! Here's how to get <strong>${esc(r.name) || "your restaurant"}</strong> live in 10 minutes:</p>
          <ol style="line-height:2.2;padding-left:20px">
            <li><strong>Upload your menu</strong> — take a photo and our AI will extract every item automatically.</li>
            <li><strong>Customise your style</strong> — pick colours, fonts, and a template that matches your brand.</li>
            <li><strong>Publish and get your QR code</strong> — print it and put it on every table.</li>
            <li><strong>Watch orders come in</strong> — your AI Digital Waiter handles the rest.</li>
          </ol>
          <a href="${siteUrl}/upload" style="display:inline-block;margin-top:8px;padding:12px 28px;background:#FF6B00;color:white;font-weight:bold;border-radius:12px;text-decoration:none">Upload My Menu Now</a>
          <p style="font-size:13px;color:#555;margin-top:24px">Your trial includes all Pro features for 14 days — AI Waiter, unlimited menus, real-time orders, staff management, and more. No credit card needed.</p>
          <p style="font-size:12px;color:#888;margin-top:16px">Sent by MENUZA AI · Reply to this email if you need any help getting set up.</p>
        </div>
      </div>`, resendKey);
    sent++;
  }

  const breakdown = {
    paidExpiry: (expiringPaid ?? []).length,
    trialDay12: (trialExpiring ?? []).length,
    trialDay7: (trialMid ?? []).length,
    trialDay1: (trialNew ?? []).length,
  };
  await completeCronRun(runId, sent, breakdown);
  return NextResponse.json({ sent, breakdown });
}
