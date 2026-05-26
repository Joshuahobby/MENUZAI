import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { BackToTop } from "@/components/BackToTop";

const LAST_UPDATED = "1 January 2026";

export const metadata = {
  title: "Privacy Policy — MENUZA AI",
  description: "How MENUZA AI collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#faf8f6] text-on-surface">

      <PublicNav />

      {/* ── Content ── */}
      <main className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs font-bold tracking-[0.25em] uppercase text-primary/70 mb-4">Legal</p>
        <h1 className="text-4xl font-[var(--font-headline)] font-extrabold tracking-tighter mb-3">Privacy Policy</h1>
        <p className="text-secondary text-sm mb-12">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-sm max-w-none space-y-10 text-on-surface/80 leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">1. Who We Are</h2>
            <p>MENUZA AI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is operated by Menuza Systems Inc., based in Kigali, Rwanda. We provide an AI-powered digital menu platform for restaurants.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">2. Information We Collect</h2>
            <p>We collect information you provide directly, including:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Account data</strong> — email address, password (hashed), restaurant name, and phone number.</li>
              <li><strong>Menu content</strong> — items, prices, descriptions, and images you upload.</li>
              <li><strong>Usage data</strong> — pages visited, features used, and menu analytics events.</li>
              <li><strong>Payment data</strong> — transaction identifiers processed via PawaPay (we do not store card numbers).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and improve the Service.</li>
              <li>To process payments and send order or subscription notifications.</li>
              <li>To generate aggregated, anonymised analytics.</li>
              <li>To respond to support requests.</li>
            </ul>
            <p className="mt-3">We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">4. Data Storage and Security</h2>
            <p>Your data is stored on Supabase (PostgreSQL) servers. We use row-level security, encrypted connections (TLS), and hashed passwords. Images are stored in Supabase Storage with access controls. We take reasonable technical and organisational measures to protect your data.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">5. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Supabase</strong> — database, authentication, and file storage.</li>
              <li><strong>OpenRouter / Anthropic</strong> — AI menu extraction and conversational features.</li>
              <li><strong>PawaPay</strong> — mobile money payment processing.</li>
              <li><strong>Resend</strong> — transactional email delivery.</li>
              <li><strong>Vercel</strong> — application hosting and CDN.</li>
            </ul>
            <p className="mt-3">Each service operates under its own privacy policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">6. Customer Data</h2>
            <p>When your customers place orders or submit reviews through your public menu, we store the minimum information needed (order details, optional customer name/email for receipts, review content). This data belongs to you as the restaurant operator and is accessible only to you and your staff.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">7. Cookies</h2>
            <p>We use session cookies for authentication. We do not use advertising or tracking cookies. Analytics events are stored server-side in your account, not in your browser.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">8. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data at any time. To delete your account and all associated data, contact us at <a href="mailto:support@menuzai.com" className="text-primary hover:underline">support@menuzai.com</a>. We will process your request within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">9. Data Retention</h2>
            <p>We retain your data for as long as your account is active. After account deletion, personal data is purged within 30 days, except where retention is required by law.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of significant changes by email. Continued use of the Service after changes takes effect constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-on-surface mb-3">11. Contact</h2>
            <p>For privacy-related questions or requests, email us at <a href="mailto:support@menuzai.com" className="text-primary hover:underline">support@menuzai.com</a>.</p>
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
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="text-primary">Privacy</Link>
          </div>
        </div>
      </footer>
      <BackToTop />
    </div>
  );
}
