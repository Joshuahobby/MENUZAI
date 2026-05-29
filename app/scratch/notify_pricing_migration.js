/**
 * One-time script: notify users affected by the pricing model migration.
 * Sends an email to all restaurants whose trial has expired (plan='free', trial_ends_at in the past).
 * These users silently moved from plan='trial' to plan='free' via migration 024.
 *
 * Usage (from app/ directory):
 *   node scratch/notify_pricing_migration.js
 *
 * Required env vars (in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   RESEND_API_KEY
 *   NEXT_PUBLIC_SITE_URL
 */

// Load .env.local manually (no dotenv dependency)
const fs = require("fs");
const path = require("path");
const envFile = path.join(__dirname, "../.env.local");
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, "utf8").split("\n").forEach(line => {
    const [key, ...rest] = line.split("=");
    if (key && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
    }
  });
}
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://menuzai.com";
const FROM = `MENUZA AI <${process.env.RESEND_FROM_EMAIL ?? "orders@ikoranabuhanga.tech"}>`;

async function sendEmail(to, subject, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`  ✗ Failed to send to ${to}: ${err}`);
    return false;
  }
  return true;
}

function buildEmail(restaurantName, siteUrl) {
  return `
<div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1c1c1e">
  <div style="background:#FF6B00;padding:24px 32px;border-radius:16px 16px 0 0">
    <h1 style="color:white;margin:0;font-size:20px">A quick update on your MENUZA AI account</h1>
  </div>
  <div style="background:#fff;padding:24px 32px;border:1px solid #e5e5ea;border-top:none;border-radius:0 0 16px 16px">
    <p>Hi ${restaurantName ? `<strong>${restaurantName}</strong>` : "there"},</p>

    <p>We've updated how MENUZA AI pricing works, and we wanted to make sure you're in the loop.</p>

    <p><strong>What changed:</strong><br>
    We've replaced the old tier structure with a cleaner model:</p>

    <ul style="line-height:2">
      <li><strong>14-day free trial</strong> — all new signups get full Pro features for 14 days</li>
      <li><strong>Pro plan</strong> — 35,000 RWF/month with a 14-day money-back guarantee</li>
      <li><strong>Free Lite</strong> — basic menu hosting with "Powered by MENUZA AI" on your menu</li>
    </ul>

    <p><strong>What this means for you:</strong><br>
    Your account is currently on <strong>Free Lite</strong>. Your digital menu is still live and your QR codes still work. Customers can still scan and order via WhatsApp.</p>

    <p>To unlock the AI Digital Waiter, real-time orders dashboard, and full analytics, upgrade to Pro — with a 14-day money-back guarantee.</p>

    <a href="${siteUrl}/dashboard/settings" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#FF6B00;color:white;font-weight:bold;border-radius:12px;text-decoration:none">
      View Plans &amp; Upgrade
    </a>

    <p style="font-size:12px;color:#888;margin-top:32px">
      Questions? Just reply to this email.<br>
      Sent by MENUZA AI · <a href="${siteUrl}" style="color:#888">menuzai.com</a>
    </p>
  </div>
</div>`;
}

async function main() {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set — aborting.");
    process.exit(1);
  }

  const now = new Date().toISOString();

  // Find free-plan restaurants whose trial has expired
  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, user_id")
    .eq("plan", "free")
    .not("trial_ends_at", "is", null)
    .lt("trial_ends_at", now);

  if (error) { console.error("DB error:", error); process.exit(1); }
  if (!restaurants?.length) { console.log("No affected restaurants found."); return; }

  console.log(`Found ${restaurants.length} restaurant(s) to notify.`);

  let sent = 0, failed = 0;
  for (const r of restaurants) {
    const { data: { user } } = await supabase.auth.admin.getUserById(r.user_id);
    const email = user?.email;
    if (!email) { console.log(`  – ${r.name}: no email found, skipping`); continue; }

    process.stdout.write(`  Sending to ${email} (${r.name})…`);
    const ok = await sendEmail(
      email,
      "A quick update on your MENUZA AI account",
      buildEmail(r.name, SITE_URL)
    );
    if (ok) { console.log(" ✓"); sent++; } else { failed++; }
  }

  console.log(`\nDone. Sent: ${sent}  Failed: ${failed}`);
}

main().catch(console.error);
