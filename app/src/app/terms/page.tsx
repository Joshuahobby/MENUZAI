import Link from "next/link";

const LAST_UPDATED = "1 January 2026";

export const metadata = {
  title: "Terms of Service — MENUZA AI",
  description: "Terms and conditions governing your use of the MENUZA AI platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#faf8f6] text-on-surface">

      {/* ── Nav ── */}
      <nav className="w-full sticky top-0 z-50 bg-[#faf8f6]/90 backdrop-blur-md border-b border-black/5">
        <div className="flex justify-between items-center px-8 h-16 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <span className="material-symbols-outlined text-white icon-fill text-base">restaurant_menu</span>
            </div>
            <span className="font-[var(--font-headline)] font-black text-base tracking-tight">
              MENUZA <span className="text-primary">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs font-bold tracking-[0.25em] uppercase text-primary/70 mb-4">Legal</p>
        <h1 className="text-4xl font-[var(--font-headline)] font-extrabold tracking-tighter mb-3">Terms of Service</h1>
        <p className="text-secondary text-sm mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-sm max-w-none space-y-10 text-on-surface/80 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">1. Acceptance of Terms</h2>
            <p>By creating an account or using the MENUZA AI platform (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">2. Description of Service</h2>
            <p>MENUZA AI provides an AI-powered digital menu platform for restaurants, including menu creation, QR code generation, order management, analytics, and related features. The Service is provided on a subscription basis (Free, Pro, and Business plans).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">3. Account Registration</h2>
            <p>You must provide accurate and complete information when registering. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Upload or distribute unlawful, harmful, or misleading content.</li>
              <li>Attempt to reverse-engineer, scrape, or disrupt the Service.</li>
              <li>Violate any applicable law or regulation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">5. Payments and Subscriptions</h2>
            <p>Paid plans are billed monthly or annually as selected. All fees are in Rwandan Francs (RWF) unless otherwise stated. Payments are processed via MTN Mobile Money, Airtel Money, or card through our payment provider. Refunds are subject to our 14-day money-back guarantee on first-time Pro subscriptions.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">6. Intellectual Property</h2>
            <p>You retain ownership of all content you upload (menu items, images, restaurant information). By uploading content, you grant MENUZA AI a non-exclusive, worldwide licence to store, display, and process that content solely to provide the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">7. Limitation of Liability</h2>
            <p>The Service is provided &quot;as is&quot;. To the fullest extent permitted by law, MENUZA AI shall not be liable for indirect, incidental, or consequential damages arising from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">8. Termination</h2>
            <p>Either party may terminate the agreement at any time. On termination, your access to the Service will end. You may export your menu data before termination.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">9. Changes to Terms</h2>
            <p>We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the revised Terms. We will notify users of material changes by email.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">10. Governing Law</h2>
            <p>These Terms are governed by the laws of the Republic of Rwanda. Disputes shall be resolved in the courts of Kigali, Rwanda.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">11. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:support@menuzai.com" className="text-primary hover:underline">support@menuzai.com</a>.</p>
          </section>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-black/5 mt-12 py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-secondary/50">© 2026 Menuza Systems Inc. All rights reserved.</p>
          <div className="flex gap-6 text-xs font-medium text-secondary/60">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="/terms" className="text-primary">Terms</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
