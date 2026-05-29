"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { pricingPlans } from "@/data/mockData";
import { PublicNav } from "@/components/PublicNav";
import { BackToTop } from "@/components/BackToTop";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

const FEATURES = [
  { icon: "support_agent",        title: "AI Digital Waiter",       desc: "Greets guests on arrival, takes orders in chat, and follows up after the meal — a full-service waiter that costs nothing per shift." },
  { icon: "receipt_long",         title: "Real-time Ordering",       desc: "Orders appear on your staff panel the moment they are placed. No printers, no delays." },
  { icon: "document_scanner",     title: "Upload & Convert",         desc: "Photograph your paper menu. Our AI reads every item, price, and description in seconds." },
  { icon: "analytics",            title: "Live Analytics",           desc: "Know which dishes get viewed but not ordered. Make decisions on data, not intuition." },
  { icon: "chat",                 title: "WhatsApp Integration",     desc: "Orders flow straight into your WhatsApp — no third-party app required." },
  { icon: "notifications",        title: "Instant Alerts",           desc: "Push, email, and in-dashboard notifications the moment a customer places an order." },
];

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  return (
    <div className="min-h-screen bg-[#faf8f6] text-on-surface">

      <PublicNav />

      {/* ── Hero ── */}
      <section className="pt-24 pb-28 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-primary/70 mb-7">
              AI-Powered Restaurant Menus
            </p>
            <h1 className="text-5xl md:text-[64px] font-[var(--font-headline)] font-extrabold leading-[1.05] tracking-tighter mb-7">
              The digital menu your restaurant deserves
            </h1>
            <p className="text-lg text-secondary leading-relaxed max-w-lg mb-10">
              Turn every QR scan into a seamless guest experience. Manage orders, track performance, and let AI handle the upselling — all from one dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className="px-7 py-3.5 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity shadow-md shadow-primary/20">
                Start Free — No Card Required
              </Link>
              <a href="https://youtu.be/G4vp5NQnk-I" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-7 py-3.5 border border-black/10 text-on-surface font-bold rounded-xl text-sm hover:bg-black/3 transition-colors">
                <span className="material-symbols-outlined text-[18px] text-primary">play_circle</span>
                Watch Demo (90s)
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="bg-black rounded-3xl overflow-hidden shadow-2xl border border-black/10 aspect-video">
              <iframe
                src="https://www.youtube.com/embed/G4vp5NQnk-I?autoplay=1&mute=1&loop=1&playlist=G4vp5NQnk-I&controls=0&rel=0&modestbranding=1&playsinline=1&disablekb=1"
                title="MENUZA AI — Product Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                style={{ display: "block", pointerEvents: "none" }}
              />
            </div>
            {/* Caption */}
            <div className="mt-4 flex items-center gap-2 text-xs text-secondary font-medium justify-center">
              <span className="material-symbols-outlined text-[14px] text-primary">play_circle</span>
              90 seconds · QR scan → AI order → staff dashboard
            </div>
          </div>
        </div>
      </section>

      {/* ── Value Proposition ── */}
      <section className="py-24 bg-white border-y border-black/5 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-secondary/50 mb-4">The Problem</p>
            <h2 className="text-4xl md:text-5xl font-[var(--font-headline)] font-black tracking-tight mb-5">
              Most menus just list. Yours should sell.
            </h2>
            <p className="text-secondary text-lg max-w-xl mx-auto">
              Static menus tell guests nothing. MENUZA AI turns yours into an active, data-driven sales tool.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#faf8f6] p-8 rounded-3xl border border-black/5">
              <div className="w-10 h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-xl">visibility_off</span>
              </div>
              <h3 className="text-lg font-[var(--font-headline)] font-bold mb-3">Zero Visibility</h3>
              <p className="text-secondary text-sm leading-relaxed">You don&apos;t know which dishes get viewed but never ordered. Every day is a blind guess.</p>
            </div>

            <div className="bg-on-surface p-8 rounded-3xl">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-white text-xl">auto_awesome</span>
              </div>
              <h3 className="text-lg font-[var(--font-headline)] font-bold mb-3 text-white">MENUZA AI turns your menu into a revenue engine</h3>
              <p className="text-white/50 text-sm leading-relaxed">AI-powered design, real-time ordering, and smart analytics — all working together.</p>
            </div>

            <div className="bg-[#faf8f6] p-8 rounded-3xl border border-black/5">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-xl">qr_code_2</span>
              </div>
              <h3 className="text-lg font-[var(--font-headline)] font-bold mb-3">Scan &amp; Order</h3>
              <p className="text-secondary text-sm leading-relaxed">No app downloads. Guests scan, browse, and order in under 30 seconds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 px-6" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-secondary/50 mb-4">Features</p>
            <h2 className="text-4xl font-[var(--font-headline)] font-black tracking-tight mb-5">
              Everything you need to run a great restaurant
            </h2>
            <p className="text-secondary text-lg leading-relaxed">
              One platform. No integrations. No subscriptions for tools you won&apos;t use.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-black/6">
                <span className="material-symbols-outlined text-primary text-2xl mb-5 block">{f.icon}</span>
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/login" className="inline-block px-7 py-3.5 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity">
              Start building your menu
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing Preview ── */}
      <section className="py-24 px-6 bg-white border-y border-black/5" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-secondary/50 mb-4">Pricing</p>
            <h2 className="text-4xl font-[var(--font-headline)] font-black tracking-tight mb-4">Transparent pricing</h2>
            <p className="text-secondary">Start free. Upgrade when you grow.</p>
          </div>

          {/* Billing toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center bg-white border border-black/8 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${!isAnnual ? "bg-on-surface text-surface shadow-sm" : "text-secondary hover:text-on-surface"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2.5 cursor-pointer ${isAnnual ? "bg-on-surface text-surface shadow-sm" : "text-secondary hover:text-on-surface"}`}
              >
                Annual
                <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full transition-colors ${isAnnual ? "bg-white/15 text-white" : "bg-primary/10 text-primary"}`}>
                  1 month free
                </span>
              </button>
            </div>
          </div>

          {/* Free — inline strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#faf8f6] border border-black/6 rounded-2xl px-6 py-4 mb-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary/50">Free</span>
              <span className="text-sm font-bold text-on-surface">0 RWF</span>
              <span className="text-secondary/30 hidden sm:inline">·</span>
              {pricingPlans[0].features.map((f, j) => (
                <span key={j} className="text-xs text-secondary/60 hidden sm:inline">
                  {f}
                  {j < pricingPlans[0].features.length - 1 && <span className="text-secondary/25 ml-2">·</span>}
                </span>
              ))}
            </div>
            <Link href="/login" className="shrink-0 text-xs font-bold text-secondary hover:text-primary transition-colors flex items-center gap-1">
              Start Free
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          {/* Pro + Business */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {pricingPlans.filter(plan => plan.amountRwf > 0).map((plan, i) => {
              const displayPrice = `${fmt(plan.amountRwf * (isAnnual ? 11 : 1))} RWF`;
              const displayPeriod = isAnnual ? "/ year" : "/ month";
              const pricingHref = `/pricing${isAnnual ? "?billing=annual" : ""}`;
              return (
                <div key={i} className={`rounded-3xl p-8 flex flex-col relative ${
                  plan.popular ? "bg-on-surface shadow-xl shadow-black/15" : "bg-[#faf8f6] border border-black/6"
                }`}>
                  {plan.popular && (
                    <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-3xl" />
                  )}
                  <p className={`text-xs font-bold tracking-[0.2em] uppercase mb-3 ${plan.popular ? "text-white/40" : "text-secondary/60"}`}>
                    {plan.name}
                  </p>
                  <div className="mb-8">
                    <span className={`text-4xl font-black ${plan.popular ? "text-white" : ""}`}>{displayPrice}</span>
                    <span className={`text-sm ml-1.5 ${plan.popular ? "text-white/40" : "text-secondary"}`}>{displayPeriod}</span>
                    {isAnnual && (
                      <p className={`text-xs mt-1 font-semibold ${plan.popular ? "text-primary" : "text-primary/80"}`}>
                        Save {fmt(plan.amountRwf)} RWF vs monthly
                      </p>
                    )}
                  </div>
                  <ul className="space-y-3 flex-grow mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <span className="material-symbols-outlined text-[14px] text-primary mt-0.5 shrink-0">check</span>
                        <span className={plan.popular ? "text-white/60" : "text-secondary"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={pricingHref}
                    className={`block w-full py-3.5 text-center text-sm font-bold rounded-xl transition-colors ${
                      plan.popular
                        ? "bg-primary text-white hover:opacity-90"
                        : "border border-black/10 text-on-surface hover:bg-black/3"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="text-center mt-8 text-sm text-secondary">
            <Link href={`/pricing${isAnnual ? "?billing=annual" : ""}`} className="text-primary font-semibold hover:underline">See full plan comparison →</Link>
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto bg-on-surface rounded-3xl px-12 py-20 text-center">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/30 mb-6">Get started</p>
          <h2 className="text-4xl md:text-5xl font-[var(--font-headline)] font-black text-white tracking-tight leading-tight mb-5">
            Elevate your restaurant&apos;s digital presence
          </h2>
          <p className="text-white/40 text-base mb-6 leading-relaxed max-w-lg mx-auto">
            Join restaurants across Africa using MENUZA AI to serve more guests, more efficiently.
          </p>
          <LiveStats />

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="px-8 py-4 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
              Start Free — No Card Required
            </Link>
            <a href="mailto:hello@ikoranabuhanga.tech" className="px-8 py-4 bg-white/8 text-white/60 font-bold rounded-xl text-sm hover:bg-white/12 transition-colors border border-white/10">
              Talk to Sales
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-black/5 bg-[#faf8f6]">
        <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
                <span className="material-symbols-outlined text-white icon-fill text-base">restaurant_menu</span>
              </div>
              <span className="font-[var(--font-headline)] font-black text-base tracking-tight">
                MENUZA <span className="text-primary">AI</span>
              </span>
            </div>
            <p className="text-secondary text-sm leading-relaxed max-w-xs">
              AI-powered digital menus for restaurants across Africa. Turn your menu into your best salesperson.
            </p>
          </div>

          <div>
            <p className="font-bold text-xs uppercase tracking-widest text-on-surface/40 mb-5">Product</p>
            <ul className="space-y-3 text-sm text-secondary">
              <li><Link href="/features"       className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="/pricing"        className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/menu/demo"      className="hover:text-primary transition-colors">Live Demo</Link></li>
              <li><Link href="/dashboard"      className="hover:text-primary transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-xs uppercase tracking-widest text-on-surface/40 mb-5">Company</p>
            <ul className="space-y-3 text-sm text-secondary">
              <li><a href="mailto:hello@ikoranabuhanga.tech" className="hover:text-primary transition-colors">Contact Us</a></li>
              <li><Link href="/login"          className="hover:text-primary transition-colors">Sign Up Free</Link></li>
              <li><Link href="/terms"          className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy"        className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-black/5">
          <div className="max-w-7xl mx-auto px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-secondary/50">© 2026 Menuza Systems Inc. All rights reserved.</p>
            <p className="text-xs text-secondary/50">Built for restaurants in Africa</p>
          </div>
        </div>
      </footer>
      <BackToTop />
    </div>
  );
}

function LiveStats() {
  const [stats, setStats] = useState<{ restaurants: number; orders: number } | null>(null);

  useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return <div className="mb-8 h-8" />;

  return (
    <div className="flex items-center justify-center gap-6 mb-8 text-white/60 text-sm">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[18px] icon-fill">store</span>
        <span><strong className="text-white font-black">{fmt(stats.restaurants)}+</strong> restaurants</span>
      </div>
      <span className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[18px] icon-fill">receipt_long</span>
        <span><strong className="text-white font-black">{fmt(stats.orders)}+</strong> orders served</span>
      </div>
    </div>
  );
}
