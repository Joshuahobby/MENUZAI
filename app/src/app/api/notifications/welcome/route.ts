import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function POST(req: Request) {
  try {
    // Require the caller to be authenticated — derive userId from session,
    // never trust it from the request body.
    const supabase = await createSupabaseServerClient();
    const { data: { user: sessionUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantName } = await req.json();

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ sent: false, reason: "RESEND_API_KEY not configured" });
    }

    const email = sessionUser.email;
    if (!email) {
      return NextResponse.json({ sent: false, reason: "User email not found" });
    }

    const name = esc(restaurantName) || "your restaurant";
    const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://menuzaai.com"}/dashboard`;
    const uploadUrl  = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://menuzaai.com"}/upload`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;padding:0 16px">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#a04100,#FF6B00);border-radius:20px 20px 0 0;padding:36px 40px;text-align:center">
      <div style="display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,0.15);border-radius:999px;padding:8px 18px;margin-bottom:20px">
        <span style="font-size:16px">🍽️</span>
        <span style="color:white;font-size:13px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase">MENUZA AI</span>
      </div>
      <h1 style="color:white;margin:0;font-size:28px;font-weight:900;letter-spacing:-0.5px;line-height:1.2">
        Welcome to MENUZA AI!
      </h1>
      <p style="color:rgba(255,255,255,0.80);margin:10px 0 0;font-size:15px">
        ${name} is ready to go digital.
      </p>
    </div>

    <!-- Body -->
    <div style="background:white;border-radius:0 0 20px 20px;padding:36px 40px;border:1px solid #e5e5ea;border-top:none">

      <p style="font-size:16px;color:#1c1c1e;margin:0 0 24px">
        Your account is set up and your restaurant profile is live. Here's how to get the most out of MENUZA AI in the next few minutes:
      </p>

      <!-- Steps -->
      <div style="space-y:0">
        ${[
          { num: "1", title: "Upload your menu", desc: "Take a photo of your existing menu — our AI extracts all items in seconds.", href: uploadUrl,  cta: "Upload Now →" },
          { num: "2", title: "Customise the look", desc: "Choose a template, set your brand colours, and pick your fonts.", href: dashboardUrl, cta: "Open Editor →" },
          { num: "3", title: "Go live with a QR code", desc: "Publish your menu and download your QR poster to print for tables.", href: dashboardUrl, cta: "Get QR Code →" },
        ].map(s => `
          <div style="display:flex;gap:16px;padding:16px 0;border-bottom:1px solid #f0f0f0">
            <div style="width:36px;height:36px;border-radius:10px;background:#FF6B00;color:white;font-size:15px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              ${s.num}
            </div>
            <div style="flex:1">
              <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1c1c1e">${s.title}</p>
              <p style="margin:0 0 8px;font-size:13px;color:#666;line-height:1.5">${s.desc}</p>
              <a href="${s.href}" style="font-size:12px;font-weight:700;color:#a04100;text-decoration:none">${s.cta}</a>
            </div>
          </div>
        `).join("")}
      </div>

      <!-- CTA button -->
      <div style="text-align:center;margin:32px 0 0">
        <a href="${dashboardUrl}" style="display:inline-block;background:#a04100;color:white;font-size:15px;font-weight:800;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:-0.2px">
          Go to Dashboard →
        </a>
      </div>

      <!-- Help -->
      <p style="font-size:13px;color:#999;text-align:center;margin:28px 0 0;line-height:1.6">
        Questions? Reply to this email or write to
        <a href="mailto:support@menuzaai.com" style="color:#a04100;text-decoration:none">support@menuzaai.com</a>
        — we reply within a few hours.
      </p>
    </div>

    <!-- Footer -->
    <p style="text-align:center;font-size:12px;color:#aaa;margin:20px 0 40px">
      © 2026 Menuza Systems Inc. ·
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://menuzaai.com"}/privacy" style="color:#aaa">Privacy</a> ·
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://menuzaai.com"}/terms" style="color:#aaa">Terms</a>
    </p>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `MENUZA AI <${process.env.RESEND_FROM_EMAIL ?? "hello@menuzai.com"}>`,
        to: [email],
        subject: `Welcome to MENUZA AI — ${name} is ready to go live!`,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Welcome email failed:", body);
      if (body.includes("domain is not verified")) {
        console.error("ACTION REQUIRED: Verify the domain in RESEND_FROM_EMAIL on https://resend.com/domains");
      }
      return NextResponse.json({ sent: false, reason: "Resend API error" });
    }

    return NextResponse.json({ sent: true });

  } catch (err) {
    console.error("Welcome email route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
