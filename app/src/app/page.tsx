"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLivePricing } from "@/hooks/useLivePricing";
import { PublicNav } from "@/components/PublicNav";
import { BackToTop } from "@/components/BackToTop";
import { supabase } from "@/lib/supabase";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

const FEATURES = [
  { icon: "support_agent",    title: "AI Digital Waiter",   desc: "Greets guests on arrival, takes orders in chat, and follows up after the meal — a full-service waiter that costs nothing per shift." },
  { icon: "receipt_long",     title: "Real-time Ordering",  desc: "Orders appear on your staff panel the moment they are placed. No printers, no delays." },
  { icon: "document_scanner", title: "Upload & Convert",    desc: "Photograph your paper menu. Our AI reads every item, price, and description in seconds." },
  { icon: "analytics",        title: "Live Analytics",      desc: "Know which dishes get viewed but not ordered. Make decisions on data, not intuition." },
  { icon: "chat",             title: "WhatsApp Integration",desc: "Orders flow straight into your WhatsApp — no third-party app required." },
  { icon: "notifications",    title: "Instant Alerts",      desc: "Push, email, and in-dashboard notifications the moment a customer places an order." },
];

const STEPS = [
  { num: "1",   label: "Photograph",  sub: "Your paper menu" },
  { num: "7s",  label: "AI reads it", sub: "Every item extracted" },
  { num: "3",   label: "You edit",    sub: "Add prices, photos, tags" },
  { num: "→",   label: "It's live",   sub: "QR code ready to print" },
];

export default function LandingPage() {
  const pricingPlans = useLivePricing();
  const [isAnnual, setIsAnnual] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard");
      } else {
        setIsLoggedIn(false);
      }
    });
  }, [router]);

  const ctaHref = isLoggedIn ? "/dashboard" : "/login?signup=true";

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <PublicNav />

      {/* ── Hero ── */}
      <section className="min-h-[92vh] grid grid-cols-1 lg:grid-cols-[1fr_42%] overflow-hidden">
        {/* Left — copy */}
        <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-28 lg:py-0">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary/70 mb-8 flex items-center gap-3">
            <span className="w-8 h-px bg-primary/70 inline-block" />
            Built for Africa
          </p>
          <h1
            className="text-5xl sm:text-6xl lg:text-[4.5rem] font-extrabold leading-[1.03] tracking-tighter mb-8"
          >
            Your menu.<br />
            In their hands.<br />
            <span className="text-primary">In two minutes.</span>
          </h1>
          <p className="text-lg text-secondary leading-relaxed max-w-lg mb-10">
            Photograph your paper menu. AI reads every item in 7 seconds. Publish a live QR menu — no technical knowledge required.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={ctaHref}
              className="px-7 py-3.5 bg-primary text-white font-bold rounded-[2rem] text-sm hover:bg-[#a04100] transition-colors shadow-md shadow-primary/20"
            >
              Start free — no card needed
            </Link>
            <a
              href="#demo"
              className="flex items-center gap-2 px-7 py-3.5 border border-outline-variant text-on-surface font-bold rounded-[2rem] text-sm hover:border-primary/40 hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">play_circle</span>
              Watch demo (90s)
            </a>
          </div>
        </div>

        {/* Right — phone mockup, bleed to edge */}
        <div className="hidden lg:flex bg-surface-card items-center justify-center relative overflow-hidden">
          <div className="w-[220px] rounded-[2.2rem] p-5 shadow-2xl relative z-10 bg-on-surface -rotate-3">
            <p className="font-syne font-extrabold text-[0.85rem] text-primary mb-3 tracking-[-0.01em]">
              Nyamirambo Kitchen
            </p>
            <div className="h-[3px] bg-primary rounded-full mb-3" />
            <p className="text-[0.6rem] font-bold text-surface/80 uppercase tracking-wider mb-2">Mains</p>
            {[
              ["Brochette ya Nk'osa", "3,500"],
              ["Isombe na Poisson",   "2,800"],
              ["Igisafuriya cy'Inkoko","4,200"],
              ["Chips na Viande",     "3,000"],
            ].map(([name, price]) => (
              <div key={name} className="flex justify-between items-center py-1.5 border-b border-white/10 text-[0.55rem]">
                <span className="text-surface/70">{name}</span>
                <span className="text-primary font-semibold">{price} RWF</span>
              </div>
            ))}
            <p className="text-[0.5rem] text-primary/50 text-center mt-3">Powered by MENUZA AI</p>
          </div>
          {/* Background word */}
          <span className="absolute bottom-6 right-4 select-none pointer-events-none leading-none font-syne font-extrabold text-[6rem] text-primary opacity-[0.07]">
            LIVE
          </span>
        </div>
      </section>

      {/* ── Progress Strip ── */}
      <div className="bg-on-surface">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={i} className="px-8 py-8 border-r border-white/10 last:border-r-0 col-span-1">
              <p className="text-primary leading-none mb-2 font-syne font-extrabold text-[2rem]">
                {step.num}
              </p>
              <p className="text-sm font-semibold text-surface/90 mb-0.5">{step.label}</p>
              <p className="text-xs text-surface/40">{step.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Value Proposition ── */}
      <section className="py-24 bg-surface-container-lowest border-y border-black/5 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-secondary/50 mb-4">The Problem</p>
            <h2
              className="text-4xl md:text-5xl font-black tracking-tight mb-5"
  
            >
              Most menus just list. Yours should sell.
            </h2>
            <p className="text-secondary text-lg max-w-xl mx-auto">
              Static menus tell guests nothing. MENUZA AI turns yours into an active, data-driven sales tool.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-surface p-8 rounded-3xl border border-black/5">
              <div className="w-10 h-10 bg-error-container/50 text-error/60 rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-xl">visibility_off</span>
              </div>
              <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-headline)" }}>Zero Visibility</h3>
              <p className="text-secondary text-sm leading-relaxed">You don&apos;t know which dishes get viewed but never ordered. Every day is a blind guess.</p>
            </div>

            <div className="bg-on-surface p-8 rounded-3xl">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-white text-xl">auto_awesome</span>
              </div>
              <h3 className="text-lg font-bold mb-3 text-white" style={{ fontFamily: "var(--font-headline)" }}>MENUZA AI turns your menu into a revenue engine</h3>
              <p className="text-white/50 text-sm leading-relaxed">AI-powered design, real-time ordering, and smart analytics — all working together.</p>
            </div>

            <div className="bg-surface p-8 rounded-3xl border border-black/5">
              <div className="w-10 h-10 bg-tertiary/10 text-tertiary rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-xl">qr_code_2</span>
              </div>
              <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "var(--font-headline)" }}>Scan &amp; Order</h3>
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
            <h2
              className="text-4xl font-black tracking-tight mb-5"
  
            >
              Everything you need to run a great restaurant
            </h2>
            <p className="text-secondary text-lg leading-relaxed">
              One platform. No integrations. No subscriptions for tools you won&apos;t use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-5 py-7 border-b border-black/6">
                <div className="shrink-0 w-11 h-11 rounded-2xl bg-primary/8 flex items-center justify-center mt-0.5">
                  <span className="material-symbols-outlined text-primary text-xl">{f.icon}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-[0.2em] uppercase text-secondary/30 mb-1">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h3 className="text-lg font-bold mb-1.5">{f.title}</h3>
                  <p className="text-secondary text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href={ctaHref} className="inline-block px-7 py-3.5 bg-primary text-white font-bold rounded-[2rem] text-sm hover:bg-[#a04100] transition-colors">
              Start building your menu
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI Waiter Showcase ── */}
      <section className="py-28 px-6 bg-surface-container-lowest border-y border-black/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-primary/70 mb-5">AI Digital Waiter</p>
            <h2
              className="text-4xl md:text-5xl font-black tracking-tight leading-[1.06] mb-6"
  
            >
              Your best waiter.<br />Works every shift.
            </h2>
            <p className="text-secondary text-lg leading-relaxed mb-8 max-w-md">
              The moment a customer scans your QR code, your AI Waiter greets them, answers questions, upsells high-margin dishes, and places their order — all in chat, no app required.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                { icon: "schedule",     text: "Available 24/7 — never calls in sick" },
                { icon: "trending_up",  text: "Proactively suggests add-ons to increase order value" },
                { icon: "translate",    text: "Adapts tone — friendly, formal, or vibrant" },
                { icon: "rate_review",  text: "Follows up after the meal to prompt a review" },
              ].map((item) => (
                <li key={item.icon} className="flex items-center gap-3 text-sm text-secondary">
                  <span className="material-symbols-outlined text-[18px] text-primary shrink-0">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-3">
              <Link href="/demo/owner" className="px-6 py-3 bg-primary text-white font-bold rounded-[2rem] text-sm hover:bg-[#a04100] transition-colors shadow-md shadow-primary/20">
                See live demo
              </Link>
              <span className="text-xs text-secondary/50">Pro &amp; Business plans</span>
            </div>
          </div>

          {/* Chat mockup */}
          <div className="relative">
            <div className="bg-on-surface rounded-[2rem] overflow-hidden shadow-2xl max-w-sm mx-auto">
              <div className="bg-primary px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white text-xl icon-fill">robot_2</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">AI Digital Waiter</p>
                  <p className="text-white/60 text-[10px] uppercase tracking-widest font-black">Powered by MENUZA AI</p>
                </div>
                <div className="ml-auto w-2 h-2 bg-tertiary/70 rounded-full animate-pulse" />
              </div>

              <div className="px-4 py-5 space-y-4 bg-surface-container-lowest">
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm icon-fill">robot_2</span>
                  </div>
                  <div className="bg-surface-container rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]">
                    <p className="text-xs text-on-surface leading-relaxed">Good evening! Welcome to Kigali Grill 🍽️ I&apos;m your digital waiter. What can I get for you tonight?</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-primary rounded-2xl rounded-br-sm px-4 py-3 max-w-[75%]">
                    <p className="text-xs text-white leading-relaxed">What&apos;s your most popular dish?</p>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm icon-fill">robot_2</span>
                  </div>
                  <div className="bg-surface-container rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]">
                    <p className="text-xs text-on-surface leading-relaxed">Our guests love the <strong>Grilled Tilapia</strong> 🐟 — crispy skin, served with plantain and kachumbari. It&apos;s our bestseller this week! Shall I add it for you?</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-primary rounded-2xl rounded-br-sm px-4 py-3 max-w-[75%]">
                    <p className="text-xs text-white leading-relaxed">Yes! And a Fanta please.</p>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="w-7 h-7 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm icon-fill">robot_2</span>
                  </div>
                  <div className="bg-surface-container rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]">
                    <p className="text-xs text-on-surface leading-relaxed">Perfect! 🛎️ <strong>Grilled Tilapia + Fanta Orange</strong> — 7,500 RWF total. Confirming your order now...</p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-4 bg-surface-container-lowest border-t border-surface-container flex items-center gap-2">
                <div className="flex-1 bg-surface-container rounded-xl px-4 py-2.5 text-xs text-secondary/40">
                  Ask about the menu…
                </div>
                <button type="button" className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white text-sm">send</span>
                </button>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 bg-surface rounded-2xl shadow-xl border border-black/6 px-4 py-3 items-center gap-2.5 hidden lg:flex">
              <span className="material-symbols-outlined text-tertiary text-xl">receipt_long</span>
              <div>
                <p className="text-xs font-black text-on-surface">Order confirmed</p>
                <p className="text-[10px] text-secondary">Sent to kitchen · 12:47 PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Demo Video ── */}
      <section className="py-24 px-6" id="demo">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-secondary/50 mb-4">See It in Action</p>
            <h2
              className="text-4xl font-black tracking-tight mb-4"
  
            >
              From photo to live menu in 90 seconds
            </h2>
            <p className="text-secondary max-w-md mx-auto">
              Watch a restaurant owner photograph their menu, edit with AI, and go live — start to finish.
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-black/8 aspect-video bg-on-surface">
            <video
              poster="https://img.youtube.com/vi/G4vp5NQnk-I/maxresdefault.jpg"
              controls
              preload="none"
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="/menuza-demo.mp4" type="video/mp4" />
            </video>
          </div>
          <p className="text-center mt-4 text-xs text-secondary/50">90 seconds · QR scan → AI extraction → staff dashboard</p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 px-6 bg-surface-container-lowest border-y border-black/5" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-secondary/50 mb-4">Pricing</p>
            <h2
              className="text-4xl font-black tracking-tight mb-4"
  
            >
              Transparent pricing
            </h2>
            <p className="text-secondary">14-day free trial — no credit card required. Upgrade when you&apos;re ready.</p>
          </div>

          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center bg-surface border border-black/8 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${!isAnnual ? "bg-on-surface text-surface shadow-sm" : "text-secondary hover:text-on-surface"}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2.5 cursor-pointer ${isAnnual ? "bg-on-surface text-surface shadow-sm" : "text-secondary hover:text-on-surface"}`}
              >
                Annual
                <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full transition-colors ${isAnnual ? "bg-white/15 text-white" : "bg-primary/10 text-primary"}`}>
                  1 month free
                </span>
              </button>
            </div>
          </div>

          {/* Free Lite strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border border-black/6 rounded-2xl px-6 py-4 mb-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary/50">Free Lite</span>
              <span className="text-sm font-bold text-on-surface">0 RWF</span>
              <span className="text-secondary/30 hidden sm:inline">·</span>
              {pricingPlans[0].features.map((f, j) => (
                <span key={j} className="text-xs text-secondary/60 hidden sm:inline">
                  {f}
                  {j < pricingPlans[0].features.length - 1 && <span className="text-secondary/25 ml-2">·</span>}
                </span>
              ))}
            </div>
            <Link href={ctaHref} className="shrink-0 text-xs font-bold text-secondary hover:text-primary transition-colors flex items-center gap-1">
              Start 14-day Trial
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {pricingPlans.filter(plan => plan.amountRwf > 0).map((plan, i) => {
              const displayPrice = `${fmt(plan.amountRwf * (isAnnual ? 11 : 1))} RWF`;
              const displayPeriod = isAnnual ? "/ year" : "/ month";
              const pricingHref = `/pricing${isAnnual ? "?billing=annual" : ""}`;
              return (
                <div key={i} className={`rounded-3xl p-8 flex flex-col relative ${plan.popular ? "bg-on-surface shadow-xl shadow-black/15" : "bg-surface border border-black/6"}`}>
                  {plan.popular && (
                    <div className="absolute -top-px left-0 right-0 h-px bg-linear-to-r from-transparent via-primary to-transparent rounded-t-3xl" />
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
                  <ul className="space-y-3 grow mb-8">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <span className="material-symbols-outlined text-[14px] text-primary mt-0.5 shrink-0">check</span>
                        <span className={plan.popular ? "text-white/60" : "text-secondary"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={pricingHref}
                    className={`block w-full py-3.5 text-center text-sm font-bold rounded-[2rem] transition-colors ${plan.popular ? "bg-primary text-white hover:bg-[#a04100]" : "border border-black/10 text-on-surface hover:bg-black/3"}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="text-center mt-8 text-sm text-secondary">
            <Link href={`/pricing${isAnnual ? "?billing=annual" : ""}`} className="text-primary font-semibold hover:underline">
              See full plan comparison →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto bg-on-surface rounded-3xl px-12 py-20 text-center">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/30 mb-6">Get started</p>
          <h2
            className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-5"

          >
            Elevate your restaurant&apos;s digital presence
          </h2>
          <p className="text-white/40 text-base mb-6 leading-relaxed max-w-lg mx-auto">
            Join restaurants across Africa using MENUZA AI to serve more guests, more efficiently.
          </p>
          <LiveStats />
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={ctaHref} className="px-8 py-4 bg-primary text-white font-bold rounded-[2rem] text-sm hover:bg-[#a04100] transition-colors shadow-lg shadow-primary/20">
              Start Free Trial — No Card Required
            </Link>
            <a href="mailto:support@menuzaai.com" className="px-8 py-4 bg-white/8 text-white/60 font-bold rounded-[2rem] text-sm hover:bg-white/12 transition-colors border border-white/10">
              Talk to Sales
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-black/5 bg-surface">
        <div className="max-w-7xl mx-auto px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
                <span className="material-symbols-outlined text-white icon-fill text-base">restaurant_menu</span>
              </div>
              <span className="font-headline font-black text-base tracking-tight">
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
              <li><Link href="/features"  className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="/pricing"   className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/menu/demo" className="hover:text-primary transition-colors">Live Demo</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-xs uppercase tracking-widest text-on-surface/40 mb-5">Company</p>
            <ul className="space-y-3 text-sm text-secondary">
              <li><a href="mailto:support@menuzaai.com" className="hover:text-primary transition-colors">Contact Us</a></li>
              <li><Link href={ctaHref}   className="hover:text-primary transition-colors">Sign Up Free</Link></li>
              <li><Link href="/terms"    className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy"  className="hover:text-primary transition-colors">Privacy Policy</Link></li>
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

  if (!stats || stats.restaurants < 10 || stats.orders < 1000) return <div className="mb-8 h-8" />;

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
