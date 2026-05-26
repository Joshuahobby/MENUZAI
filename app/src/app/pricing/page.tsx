"use client";

import Link from "next/link";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

const MONTHLY_PRICES = { pro: 35000, business: 89000 };

const FREE_FEATURES = [
  { text: "1 Digital Menu (draft or published)", icon: "restaurant_menu" },
  { text: "Standard QR Code", icon: "qr_code_2" },
  { text: "Basic Analytics (7-day history)", icon: "bar_chart" },
  { text: "WhatsApp Ordering", icon: "chat" },
  { text: "3 Menu Templates", icon: "style" },
];

const PRO_FEATURES = [
  { text: "Everything in Free", icon: "check_circle", highlight: true },
  { text: "Unlimited Menus", icon: "library_add" },
  { text: "AI Menu Extraction (up to 5 photos)", icon: "auto_awesome" },
  { text: "AI Digital Waiter", icon: "support_agent" },
  { text: "AI Review Reply Generator", icon: "rate_review" },
  { text: "Real-time Order Management", icon: "receipt_long" },
  { text: "Live Analytics (up to 90 days)", icon: "analytics" },
  { text: "Staff Management & Roles", icon: "group" },
  { text: "Premium QR Poster Templates", icon: "local_printshop" },
  { text: "Gallery Uploads per Item", icon: "photo_library" },
  { text: "Email Order Notifications", icon: "mark_email_read" },
];

const BUSINESS_FEATURES = [
  { text: "Everything in Pro", icon: "check_circle", highlight: true },
  { text: "Multi-location Support", icon: "location_on" },
  { text: "Dedicated Account Manager", icon: "person_pin" },
  { text: "Priority Support (48h SLA)", icon: "support" },
  { text: "Custom Domain Mapping", icon: "dns" },
  { text: "POS & CRM Integration", icon: "sync_alt", soon: true },
  { text: "Advanced White-labelling", icon: "brush", soon: true },
];

const faqs = [
  {
    q: "Can I switch plans later?",
    a: "Yes. You can upgrade or downgrade at any time. Changes take effect immediately.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "The Free plan is free forever with no credit card required. Pro plans come with a 14-day money-back guarantee.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept MTN Mobile Money, Airtel Money, and major credit/debit cards.",
  },
  {
    q: "How does the annual discount work?",
    a: "When you choose annual billing, you pay for 11 months and get 12 — that's one full month completely free.",
  },
];

interface FeatureItem {
  text: string;
  icon: string;
  highlight?: boolean;
  soon?: boolean;
}

function FeatureList({ features, popular }: { features: FeatureItem[]; popular?: boolean }) {
  return (
    <ul className="space-y-3 mb-10 flex-grow">
      {features.map((f, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 icon-fill ${
            f.highlight ? "text-tertiary" : popular ? "text-primary" : "text-tertiary-container"
          }`}>
            {f.highlight ? "verified" : f.icon}
          </span>
          <span className={popular ? "text-on-surface" : "text-secondary"}>
            {f.text}
            {f.soon && (
              <span className="ml-2 text-[9px] font-black uppercase tracking-wider bg-outline-variant/20 text-secondary px-1.5 py-0.5 rounded-full">
                Soon
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ name: "", price: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
  }, []);

  const proMonthly = MONTHLY_PRICES.pro;
  const proAnnual = proMonthly * 11;
  const businessMonthly = MONTHLY_PRICES.business;
  const businessAnnual = businessMonthly * 11;

  const proPrice = isAnnual ? proAnnual : proMonthly;
  const businessPrice = isAnnual ? businessAnnual : businessMonthly;

  const openCheckout = (name: string, price: number, e: React.MouseEvent) => {
    if (isLoggedIn) {
      e.preventDefault();
      setSelectedPlan({ name, price });
      setCheckoutModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        planName={selectedPlan.name}
        priceAmount={selectedPlan.price}
      />

      {/* Nav */}
      <nav className="w-full sticky top-0 z-50 bg-surface/80 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center px-6 py-3 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-white icon-fill text-lg">restaurant_menu</span>
            </div>
            <span className="font-[var(--font-headline)] font-black text-lg tracking-tight">
              MENUZA <span className="text-primary">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-secondary font-bold text-sm px-4 py-2 hover:text-primary transition-colors">
                  Log In
                </Link>
                <Link href="/login" className="hidden md:block px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-12 px-6 text-center">
        <span className="inline-block py-1 px-4 rounded-full bg-primary/10 text-primary font-bold text-xs tracking-widest uppercase mb-6">
          Pricing
        </span>
        <h1 className="text-5xl md:text-6xl font-[var(--font-headline)] font-extrabold tracking-tighter mb-5">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-secondary max-w-2xl mx-auto mb-10">
          Start free. Upgrade when you&apos;re ready. No hidden fees, no surprises.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-4 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-1.5 shadow-sm">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              !isAnnual ? "bg-primary text-white shadow-md shadow-primary/20" : "text-secondary hover:text-on-surface"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              isAnnual ? "bg-primary text-white shadow-md shadow-primary/20" : "text-secondary hover:text-on-surface"
            }`}
          >
            Annual
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors ${
              isAnnual ? "bg-white/20 text-white" : "bg-tertiary/15 text-tertiary"
            }`}>
              1 Month Free
            </span>
          </button>
        </div>

        {isAnnual && (
          <p className="text-xs text-secondary mt-4 animate-[fadeIn_0.3s_ease]">
            Annual billing — pay for 11 months, get 12.
          </p>
        )}
      </section>

      {/* Plans */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

          {/* Free */}
          <div className="bg-surface-container-lowest p-8 rounded-[2rem] flex flex-col border border-outline-variant/10">
            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-secondary text-xl">restaurant_menu</span>
              </div>
              <h3 className="text-xl font-[var(--font-headline)] font-bold mb-1">Free</h3>
              <p className="text-secondary text-xs">Perfect for getting started</p>
            </div>
            <div className="mb-8">
              <span className="text-5xl font-black">Free</span>
              <span className="text-secondary text-sm ml-1">forever</span>
            </div>
            <FeatureList features={FREE_FEATURES} />
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              className="w-full py-4 font-bold rounded-2xl transition-all text-center block bg-surface-container-highest text-on-surface hover:bg-surface-variant"
            >
              Start Free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-surface-container-lowest p-8 rounded-[2rem] flex flex-col relative border-2 border-primary md:scale-105 shadow-2xl shadow-primary/10 z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              Most Popular
            </div>
            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-primary text-xl icon-fill">auto_awesome</span>
              </div>
              <h3 className="text-xl font-[var(--font-headline)] font-bold mb-1">Pro</h3>
              <p className="text-secondary text-xs">For growing restaurants</p>
            </div>
            <div className="mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black">{formatPrice(proPrice, "RWF")}</span>
              </div>
              <p className="text-secondary text-xs mt-1">
                {isAnnual ? "/ year · billed annually" : "/ month · billed monthly"}
              </p>
              {isAnnual && (
                <p className="text-tertiary text-[11px] font-bold mt-1 animate-[fadeIn_0.3s_ease]">
                  Save {formatPrice(proMonthly, "RWF")} vs monthly
                </p>
              )}
            </div>
            <div className="mb-8 mt-4 h-px bg-outline-variant/10" />
            <FeatureList features={PRO_FEATURES} popular />
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              onClick={(e) => openCheckout(`Pro (${isAnnual ? "Annual" : "Monthly"})`, proPrice, e)}
              className="w-full py-4 font-bold rounded-2xl transition-all text-center block bg-gradient-to-tr from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95"
            >
              Go Pro
            </Link>
            <p className="text-center text-[10px] text-secondary mt-3">14-day money-back guarantee</p>
          </div>

          {/* Business */}
          <div className="bg-surface-container-lowest p-8 rounded-[2rem] flex flex-col border border-outline-variant/10">
            <div className="mb-6">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-on-surface text-xl">domain</span>
              </div>
              <h3 className="text-xl font-[var(--font-headline)] font-bold mb-1">Business</h3>
              <p className="text-secondary text-xs">For multi-location operations</p>
            </div>
            <div className="mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black">{formatPrice(businessPrice, "RWF")}</span>
              </div>
              <p className="text-secondary text-xs mt-1">
                {isAnnual ? "/ year · billed annually" : "/ month · billed monthly"}
              </p>
              {isAnnual && (
                <p className="text-tertiary text-[11px] font-bold mt-1 animate-[fadeIn_0.3s_ease]">
                  Save {formatPrice(businessMonthly, "RWF")} vs monthly
                </p>
              )}
            </div>
            <div className="mb-8 mt-4 h-px bg-outline-variant/10" />
            <FeatureList features={BUSINESS_FEATURES} />
            <a
              href="mailto:hello@ikoranabuhanga.tech?subject=MENUZA%20AI%20Business%20Plan"
              className="w-full py-4 font-bold rounded-2xl transition-all text-center block bg-surface-container-highest text-on-surface hover:bg-surface-variant"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="py-16 px-6 bg-surface-container-low/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-[var(--font-headline)] font-black mb-2 text-center">Compare plans</h2>
          <p className="text-secondary text-center text-sm mb-10">All features across every tier at a glance</p>
          <div className="rounded-[2rem] overflow-hidden border border-outline-variant/10 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-outline-variant/10">
                  <th className="text-left px-6 py-4 font-bold text-secondary text-xs uppercase tracking-widest w-1/2">Feature</th>
                  <th className="text-center px-4 py-4 font-bold text-xs uppercase tracking-widest">Free</th>
                  <th className="text-center px-4 py-4 font-black text-xs uppercase tracking-widest text-primary">Pro</th>
                  <th className="text-center px-4 py-4 font-bold text-xs uppercase tracking-widest">Business</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {[
                  ["Digital Menus", "1", "Unlimited", "Unlimited"],
                  ["AI Menu Extraction", "—", "✓", "✓"],
                  ["AI Digital Waiter", "—", "✓", "✓"],
                  ["AI Review Reply", "—", "✓", "✓"],
                  ["Real-time Orders", "—", "✓", "✓"],
                  ["Analytics History", "7 days", "90 days", "90 days"],
                  ["Staff Roles", "—", "✓", "✓"],
                  ["QR Poster Templates", "Standard", "Premium", "Premium"],
                  ["Gallery Uploads", "—", "✓", "✓"],
                  ["Multi-location", "—", "—", "✓"],
                  ["Priority Support", "—", "—", "✓"],
                ].map(([feature, free, pro, biz], i) => (
                  <tr key={i} className={`${i % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface-container-lowest/50"}`}>
                    <td className="px-6 py-3.5 font-medium text-on-surface-variant">{feature}</td>
                    <td className="text-center px-4 py-3.5 text-secondary text-xs">{free}</td>
                    <td className="text-center px-4 py-3.5 text-primary font-bold text-xs">{pro}</td>
                    <td className="text-center px-4 py-3.5 text-secondary text-xs">{biz}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-[var(--font-headline)] font-black mb-12 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10">
                <p className="font-bold mb-2">{faq.q}</p>
                <p className="text-secondary text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-primary/5 to-primary-container/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-[var(--font-headline)] font-black mb-4">
            Ready to grow your restaurant?
          </h2>
          <p className="text-secondary text-lg mb-10">
            Join restaurants across Africa already using MENUZA AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-block px-10 py-5 bg-gradient-to-tr from-primary to-primary-container text-white font-black rounded-2xl text-base shadow-2xl active:scale-95 transition-all hover:opacity-90"
            >
              Start Free — No Card Required
            </Link>
            <a
              href="mailto:hello@ikoranabuhanga.tech"
              className="inline-block px-10 py-5 bg-surface-container-lowest border border-outline-variant/10 text-on-surface font-bold rounded-2xl text-base hover:bg-surface-container-low active:scale-95 transition-all"
            >
              Talk to Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-xl font-[var(--font-headline)] font-black tracking-tight text-primary">
            MENUZA AI
          </span>
          <p className="text-sm text-secondary">© 2026 Menuza Systems Inc. All rights reserved.</p>
          <div className="flex gap-6 text-sm font-semibold text-on-surface-variant">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
