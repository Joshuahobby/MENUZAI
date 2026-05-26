"use client";

import Link from "next/link";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const MONTHLY = { pro: 35000, business: 89000 };

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

const FREE_FEATURES = [
  "1 Digital Menu",
  "Standard QR Code",
  "Basic Analytics — 7-day history",
  "WhatsApp Ordering",
  "3 Menu Templates",
];

const PRO_FEATURES = [
  "Everything in Free",
  "Unlimited Menus",
  "AI Menu Extraction — up to 5 photos",
  "AI Digital Waiter",
  "AI Review Reply Generator",
  "Real-time Order Management",
  "Live Analytics — up to 90 days",
  "Staff Management & Roles",
  "Premium QR Poster Templates",
  "Gallery Uploads per Item",
  "Email Order Notifications",
];

const BUSINESS_FEATURES = [
  "Everything in Pro",
  "Multi-location Support",
  "Dedicated Account Manager",
  "Priority Support — 48 h SLA",
  "Custom Domain Mapping",
  "POS & CRM Integration",
  "Advanced White-labelling",
];

const faqs = [
  {
    q: "Can I switch plans later?",
    a: "Yes. Upgrade or downgrade at any time. Changes take effect immediately.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "The Free plan is free forever — no credit card required. Pro includes a 14-day money-back guarantee.",
  },
  {
    q: "What payment methods do you accept?",
    a: "MTN Mobile Money, Airtel Money, and major credit and debit cards.",
  },
  {
    q: "How does the annual discount work?",
    a: "You pay for 11 months and receive 12 — one full month at no charge.",
  },
];

function FeatureRow({ text, muted }: { text: string; muted?: boolean }) {
  const [main, sub] = text.split(" — ");
  return (
    <li className="flex items-start gap-3">
      <span className="material-symbols-outlined text-[15px] text-primary mt-0.5 shrink-0">check</span>
      <span className={`text-sm leading-snug ${muted ? "text-secondary" : "text-on-surface"}`}>
        {main}
        {sub && <span className="text-secondary"> — {sub}</span>}
      </span>
    </li>
  );
}

export default function PricingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("billing") === "annual") setIsAnnual(true);
  }, []);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState({ name: "", price: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
  }, []);

  const proPrice  = isAnnual ? MONTHLY.pro * 11       : MONTHLY.pro;
  const bizPrice  = isAnnual ? MONTHLY.business * 11  : MONTHLY.business;
  const period    = isAnnual ? "per year" : "per month";

  const openCheckout = (name: string, price: number, e: React.MouseEvent) => {
    if (isLoggedIn) { e.preventDefault(); setSelectedPlan({ name, price }); setCheckoutOpen(true); }
  };

  return (
    <div className="min-h-screen bg-[#faf8f6] text-on-surface">
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        planName={selectedPlan.name}
        priceAmount={selectedPlan.price}
      />

      {/* ── Nav ── */}
      <nav className="w-full sticky top-0 z-50 bg-[#faf8f6]/90 backdrop-blur-md border-b border-black/5">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <span className="material-symbols-outlined text-white icon-fill text-base">restaurant_menu</span>
            </div>
            <span className="font-[var(--font-headline)] font-black text-base tracking-tight">
              MENUZA <span className="text-primary">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-5">
              <Link href="/features" className="text-sm font-medium text-secondary hover:text-on-surface transition-colors">Features</Link>
              <Link href="/menu/demo" className="text-sm font-medium text-secondary hover:text-on-surface transition-colors">Live Demo</Link>
            </div>
            {isLoggedIn ? (
              <Link href="/dashboard" className="px-5 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:opacity-90 transition-opacity">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="px-5 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-24 pb-16 px-6 text-center">
        <p className="text-xs font-bold tracking-[0.25em] uppercase text-primary/70 mb-6">Pricing</p>
        <h1 className="text-5xl md:text-[64px] font-[var(--font-headline)] font-extrabold tracking-tighter leading-[1.05] mb-5 max-w-2xl mx-auto">
          Simple,<br className="hidden sm:block" /> transparent pricing
        </h1>
        <p className="text-lg text-secondary max-w-xl mx-auto mb-12 leading-relaxed">
          Start free. Upgrade when your restaurant is ready to grow.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-white border border-black/8 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              !isAnnual ? "bg-on-surface text-surface shadow-sm" : "text-secondary hover:text-on-surface"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 cursor-pointer ${
              isAnnual ? "bg-on-surface text-surface shadow-sm" : "text-secondary hover:text-on-surface"
            }`}
          >
            Annual
            <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full transition-colors ${
              isAnnual ? "bg-white/15 text-white" : "bg-primary/10 text-primary"
            }`}>
              1 month free
            </span>
          </button>
        </div>

        {isAnnual && (
          <p className="text-xs text-secondary/70 mt-4">
            Billed annually — pay for 11 months, get 12.
          </p>
        )}
      </section>

      {/* ── Cards ── */}
      <section className="pb-28 px-6">
        <div className="max-w-3xl mx-auto">

          {/* Free — inline strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-black/6 rounded-2xl px-6 py-4 mb-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary/50">Free</span>
              <span className="text-sm font-bold text-on-surface">0 RWF</span>
              <span className="text-secondary/30 hidden sm:inline">·</span>
              {FREE_FEATURES.map((f, i) => (
                <span key={i} className="text-xs text-secondary/60 hidden sm:inline">
                  {f.split(" — ")[0]}
                  {i < FREE_FEATURES.length - 1 && <span className="text-secondary/25 ml-2">·</span>}
                </span>
              ))}
            </div>
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              className="shrink-0 text-xs font-bold text-secondary hover:text-primary transition-colors flex items-center gap-1"
            >
              Start Free
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* Pro */}
          <div className="bg-on-surface rounded-3xl p-10 flex flex-col relative shadow-2xl shadow-black/20">
            <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-3xl" />

            <div className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/50">Pro</p>
                <span className="text-[9px] font-black tracking-widest uppercase bg-primary text-white px-2.5 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">For restaurants ready to grow.</p>
            </div>

            <div className="mb-10">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tracking-tight text-white">{fmt(proPrice)}</span>
                <span className="text-lg font-bold text-white/50 ml-1">RWF</span>
              </div>
              <p className="text-xs text-white/40 mt-1.5">{period}</p>
              {isAnnual && (
                <p className="text-xs text-primary mt-1 font-semibold">
                  Save {fmt(MONTHLY.pro)} RWF vs monthly
                </p>
              )}
            </div>

            <div className="h-px bg-white/8 mb-8" />

            <ul className="space-y-4 flex-grow mb-10">
              {PRO_FEATURES.map((f, i) => {
                const [main, sub] = f.split(" — ");
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[15px] text-primary mt-0.5 shrink-0">check</span>
                    <span className="text-sm text-white/80 leading-snug">
                      {main}
                      {sub && <span className="text-white/40"> — {sub}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>

            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              onClick={(e) => openCheckout(`Pro (${isAnnual ? "Annual" : "Monthly"})`, proPrice, e)}
              className="block w-full py-3.5 text-center text-sm font-bold rounded-xl bg-primary text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/30"
            >
              Go Pro
            </Link>
            <p className="text-center text-[10px] text-white/30 mt-3">14-day money-back guarantee</p>
          </div>

          {/* Business */}
          <div className="bg-white rounded-3xl p-10 flex flex-col border border-black/6 shadow-sm">
            <div className="mb-10">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-secondary/60 mb-3">Business</p>
              <p className="text-sm text-secondary leading-relaxed">For multi-location operations.</p>
            </div>

            <div className="mb-10">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tracking-tight">{fmt(bizPrice)}</span>
                <span className="text-lg font-bold text-secondary ml-1">RWF</span>
              </div>
              <p className="text-xs text-secondary/60 mt-1.5">{period}</p>
              {isAnnual && (
                <p className="text-xs text-primary mt-1 font-semibold">
                  Save {fmt(MONTHLY.business)} RWF vs monthly
                </p>
              )}
            </div>

            <div className="h-px bg-black/5 mb-8" />

            <ul className="space-y-4 flex-grow mb-10">
              {BUSINESS_FEATURES.map((f, i) => <FeatureRow key={i} text={f} muted />)}
            </ul>

            <a
              href="mailto:hello@ikoranabuhanga.tech?subject=MENUZA%20AI%20Business%20Plan"
              className="block w-full py-3.5 text-center text-sm font-bold rounded-xl border border-black/10 text-secondary hover:bg-black/3 transition-colors"
            >
              Contact Sales
            </a>
          </div>

          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="py-24 px-6 bg-white border-y border-black/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-secondary/50 text-center mb-4">Compare</p>
          <h2 className="text-3xl font-[var(--font-headline)] font-black mb-16 text-center tracking-tight">
            Every plan, side by side
          </h2>
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8">
                  <th className="text-left pb-5 font-medium text-secondary/60 text-xs uppercase tracking-widest w-1/2">Feature</th>
                  <th className="text-center pb-5 font-medium text-secondary/60 text-xs uppercase tracking-widest">Free</th>
                  <th className="text-center pb-5 font-black text-primary text-xs uppercase tracking-widest">Pro</th>
                  <th className="text-center pb-5 font-medium text-secondary/60 text-xs uppercase tracking-widest">Business</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Digital Menus",        "1",        "Unlimited", "Unlimited"],
                  ["AI Menu Extraction",   "—",        "✓",         "✓"],
                  ["AI Digital Waiter",    "—",        "✓",         "✓"],
                  ["AI Review Reply",      "—",        "✓",         "✓"],
                  ["Real-time Orders",     "—",        "✓",         "✓"],
                  ["Analytics History",    "7 days",   "90 days",   "90 days"],
                  ["Staff Roles",          "—",        "✓",         "✓"],
                  ["QR Poster Templates",  "Standard", "Premium",   "Premium"],
                  ["Gallery Uploads",      "—",        "✓",         "✓"],
                  ["Multi-location",       "—",        "—",         "✓"],
                  ["Priority Support",     "—",        "—",         "✓"],
                ].map(([feature, free, pro, biz], i) => (
                  <tr key={i} className="border-b border-black/4 last:border-0">
                    <td className="py-4 text-on-surface/70 font-medium">{feature}</td>
                    <td className="text-center py-4 text-secondary/50 text-xs">{free}</td>
                    <td className="text-center py-4 text-primary font-semibold text-xs">{pro}</td>
                    <td className="text-center py-4 text-secondary/50 text-xs">{biz}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-secondary/50 text-center mb-4">FAQ</p>
          <h2 className="text-3xl font-[var(--font-headline)] font-black mb-16 text-center tracking-tight">
            Questions & answers
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-black/6 rounded-2xl px-8 py-7">
                <p className="font-bold mb-2 text-[15px]">{faq.q}</p>
                <p className="text-secondary text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 px-6 bg-on-surface">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/30 mb-6">Get started</p>
          <h2 className="text-4xl font-[var(--font-headline)] font-black mb-4 text-white tracking-tight leading-tight">
            Elevate your restaurant&apos;s digital presence
          </h2>
          <p className="text-white/40 text-base mb-12 leading-relaxed">
            Join restaurants across Africa using MENUZA AI to serve more customers, more efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Start Free — No Card Required
            </Link>
            <a
              href="mailto:hello@ikoranabuhanga.tech"
              className="inline-block px-8 py-4 bg-white/8 text-white/70 font-bold rounded-xl text-sm hover:bg-white/12 transition-colors border border-white/10"
            >
              Talk to Sales
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-8 border-t border-black/6 bg-[#faf8f6]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-[var(--font-headline)] font-black tracking-tight text-primary">MENUZA AI</span>
          <p className="text-xs text-secondary/50">© 2026 Menuza Systems Inc. All rights reserved.</p>
          <div className="flex gap-8 text-xs font-medium text-secondary/60">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
            <Link href="/menu/demo" className="hover:text-primary transition-colors">Live Demo</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
