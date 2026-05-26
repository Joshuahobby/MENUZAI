"use client";

import Link from "next/link";
import Image from "next/image";
import { pricingPlans } from "@/data/mockData";

const FEATURES = [
  { icon: "support_agent",        title: "AI Digital Waiter",       desc: "Guides guests, answers questions, and upsells your highest-margin dishes — automatically." },
  { icon: "receipt_long",         title: "Real-time Ordering",       desc: "Orders appear on your staff panel the moment they are placed. No printers, no delays." },
  { icon: "document_scanner",     title: "Upload & Convert",         desc: "Photograph your paper menu. Our AI reads every item, price, and description in seconds." },
  { icon: "analytics",            title: "Live Analytics",           desc: "Know which dishes get viewed but not ordered. Make decisions on data, not intuition." },
  { icon: "chat",                 title: "WhatsApp Integration",     desc: "Orders flow straight into your WhatsApp — no third-party app required." },
  { icon: "notifications",        title: "Instant Alerts",           desc: "Push, email, and in-dashboard notifications the moment a customer places an order." },
];

export default function LandingPage() {
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

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-secondary hover:text-on-surface transition-colors">Features</a>
            <a href="#pricing"  className="text-sm font-medium text-secondary hover:text-on-surface transition-colors">Pricing</a>
            <Link href="/menu/demo" className="text-sm font-medium text-secondary hover:text-on-surface transition-colors">Live Demo</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-secondary hover:text-on-surface transition-colors hidden md:block">Log In</Link>
            <Link href="/login" className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

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
              <Link href="/menu/demo" className="px-7 py-3.5 border border-black/10 text-on-surface font-bold rounded-xl text-sm hover:bg-black/3 transition-colors">
                See Live Demo
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-3xl p-3 shadow-lg border border-black/6 overflow-hidden">
              <div className="relative w-full h-[440px]">
                <Image
                  alt="Modern Restaurant Menu"
                  className="rounded-2xl object-cover"
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm p-5 rounded-2xl border border-black/6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Live Insight</p>
                  <p className="text-sm font-bold text-on-surface">Spicy Ramen conversion up 24%</p>
                </div>
                <span className="material-symbols-outlined text-primary text-2xl">trending_up</span>
              </div>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {pricingPlans.map((plan, i) => (
              <div key={i} className={`bg-[#faf8f6] rounded-3xl p-8 flex flex-col relative ${
                plan.popular ? "bg-on-surface md:-mt-3 md:-mb-3 shadow-xl shadow-black/15" : "border border-black/6"
              }`}>
                {plan.popular && (
                  <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent rounded-t-3xl" />
                )}
                <p className={`text-xs font-bold tracking-[0.2em] uppercase mb-3 ${plan.popular ? "text-white/40" : "text-secondary/60"}`}>
                  {plan.name}
                </p>
                <div className="mb-8">
                  <span className={`text-4xl font-black ${plan.popular ? "text-white" : ""}`}>{plan.price}</span>
                  {plan.period && <span className={`text-sm ml-1.5 ${plan.popular ? "text-white/40" : "text-secondary"}`}>{plan.period}</span>}
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
                  href={plan.amountRwf === 0 ? "/login" : "/pricing"}
                  className={`block w-full py-3.5 text-center text-sm font-bold rounded-xl transition-colors ${
                    plan.popular
                      ? "bg-primary text-white hover:opacity-90"
                      : "border border-black/10 text-on-surface hover:bg-black/3"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center mt-8 text-sm text-secondary">
            Annual billing available — save one month.{" "}
            <Link href="/pricing" className="text-primary font-semibold hover:underline">See full comparison</Link>
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
          <p className="text-white/40 text-base mb-10 leading-relaxed max-w-lg mx-auto">
            Join restaurants across Africa using MENUZA AI to serve more guests, more efficiently.
          </p>
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
              <li><a href="#features"        className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#pricing"         className="hover:text-primary transition-colors">Pricing</a></li>
              <li><Link href="/menu/demo"    className="hover:text-primary transition-colors">Live Demo</Link></li>
              <li><Link href="/login"        className="hover:text-primary transition-colors">Sign Up Free</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-xs uppercase tracking-widest text-on-surface/40 mb-5">Company</p>
            <ul className="space-y-3 text-sm text-secondary">
              <li><a href="mailto:hello@ikoranabuhanga.tech" className="hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
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
    </div>
  );
}
