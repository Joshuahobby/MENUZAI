"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLivePricing } from "@/hooks/useLivePricing";
import { useInView } from "@/hooks/useInView";
import { useCounter } from "@/hooks/useCounter";
import { PublicNav } from "@/components/PublicNav";
import { BackToTop } from "@/components/BackToTop";
import { supabase } from "@/lib/supabase";

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

const CITIES = ["Kigali", "Nairobi", "Kampala", "Dar es Salaam", "Bujumbura", "Lagos"];

const HERO_PILLS = ["AI Waiter included", "QR ordering", "WhatsApp alerts", "14-day free trial"];

const FEATURES = [
  { icon: "support_agent",    title: "AI Digital Waiter",    desc: "Greets every guest the moment they scan, answers questions, upsells high-margin dishes, and places their order — all in chat. Zero staff time.",  highlight: true  },
  { icon: "document_scanner", title: "Upload & Convert",     desc: "Photograph your paper menu. AI reads every item, price, and description in 7 seconds. Edit anything, then go live.",                              highlight: false },
  { icon: "receipt_long",     title: "Real-time Ordering",   desc: "Orders hit your staff panel the instant a customer places them. No printer, no missed table, no delay.",                                            highlight: false },
  { icon: "analytics",        title: "Live Analytics",       desc: "See exactly which dishes get viewed but never ordered. Stop guessing. Fix it, earn more per table.",                                                highlight: false },
  { icon: "chat",             title: "WhatsApp Integration", desc: "Every order lands in your WhatsApp. No third-party app — your staff already knows how to use it.",                                                  highlight: false },
  { icon: "notifications",    title: "Instant Alerts",       desc: "Push, email, and in-dashboard notifications the second a customer orders. Never miss a sale again.",                                                highlight: false },
];

const STEPS = [
  { num: "1",  label: "Photograph",  sub: "Your paper menu" },
  { num: "7s", label: "AI reads it", sub: "Every item extracted" },
  { num: "3",  label: "You edit",    sub: "Add photos, prices, tags" },
  { num: "→",  label: "You're live", sub: "QR code ready to print" },
];

export default function LandingPage() {
  const pricingPlans = useLivePricing();
  const [isAnnual, setIsAnnual] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  // Scroll-reveal refs
  const [trustRef,    trustInView]    = useInView();
  const [valueRef,    valueInView]    = useInView();
  const [waiterRef,   waiterInView]   = useInView();
  const [featuresRef, featuresInView] = useInView();
  const [outcomesRef, outcomesInView] = useInView();
  const [demoRef,     demoInView]     = useInView();
  const [pricingRef,  pricingInView]  = useInView();
  const [ctaRef,      ctaInView]      = useInView();

  // Counters for outcome stats
  const count7  = useCounter(7,  900,  outcomesInView);
  const count14 = useCounter(14, 1100, outcomesInView);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
      else setIsLoggedIn(false);
    });
  }, [router]);

  const ctaHref = isLoggedIn ? "/dashboard" : "/login?signup=true";

  const rv = (dir: "up" | "left" | "right" = "up", inView = false) => {
    const base = dir === "left" ? "reveal-left" : dir === "right" ? "reveal-right" : "reveal";
    return `${base}${inView ? " visible" : ""}`;
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <PublicNav />

      {/* ── Hero ── */}
      <section className="min-h-[80vh] lg:min-h-[92vh] relative overflow-hidden">
        {/* Decorative glows — outside the grid so they don't become grid items */}
        <div className="hero-glow hidden lg:block w-[500px] h-[500px] bg-primary/6 -top-24 -left-24" />
        <div className="hero-glow hidden lg:block w-[300px] h-[300px] bg-primary-container/5 top-32 left-1/4" style={{ animationDelay: "3s" } as React.CSSProperties} />

        {/* Grid wrapper */}
        <div className="min-h-[80vh] lg:min-h-[92vh] grid grid-cols-1 lg:grid-cols-[1fr_46%]">

        {/* Left — copy */}
        <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-20 lg:py-0 relative">
          <p className="hero-animate text-xs font-bold tracking-[0.2em] uppercase text-primary/70 mb-6 flex items-center gap-3" style={{ "--ha-delay": "0ms" } as React.CSSProperties}>
            <span className="w-8 h-px bg-primary/70 inline-block" />
            Built for Africa
          </p>

          {/* Headline — each line animates in */}
          <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-extrabold leading-[1.03] tracking-tighter mb-6">
            <span className="hero-animate block" style={{ "--ha-delay": "80ms" } as React.CSSProperties}>Your menu.</span>
            <span className="hero-animate block" style={{ "--ha-delay": "160ms" } as React.CSSProperties}>In their hands.</span>
            <span className="hero-animate block text-primary" style={{ "--ha-delay": "240ms" } as React.CSSProperties}>In two minutes.</span>
          </h1>

          <p className="hero-animate text-lg text-secondary leading-relaxed max-w-lg mb-5" style={{ "--ha-delay": "360ms" } as React.CSSProperties}>
            Photograph your paper menu and get a live digital menu in seconds. Then your{" "}
            <strong className="text-on-surface">AI Waiter</strong> takes over — greeting every
            guest, answering questions, and placing orders automatically. 24/7. No extra staff.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {HERO_PILLS.map((f, i) => (
              <span
                key={f}
                className="pop-animate flex items-center gap-1.5 text-xs font-semibold text-secondary/80 bg-surface-container px-3 py-1.5 rounded-full border border-black/6"
                style={{ "--pa-delay": `${460 + i * 60}ms` } as React.CSSProperties}
              >
                <span className="material-symbols-outlined text-[12px] text-primary">check_circle</span>
                {f}
              </span>
            ))}
          </div>

          <div className="hero-animate flex flex-wrap gap-3 mb-8" style={{ "--ha-delay": "700ms" } as React.CSSProperties}>
            <Link href={ctaHref} className="px-7 py-3.5 bg-primary text-white font-bold rounded-[2rem] text-sm hover:bg-[#a04100] transition-colors shadow-md shadow-primary/20">
              Start free — no card needed
            </Link>
            <Link href="/demo" className="flex items-center gap-2 px-7 py-3.5 border border-outline-variant text-on-surface font-bold rounded-[2rem] text-sm hover:border-primary/40 hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[18px] text-primary icon-fill">robot_2</span>
              See AI Waiter live
            </Link>
          </div>

          {/* Trust signal */}
          <div className="hero-animate flex items-center gap-2.5 text-xs text-secondary/60" style={{ "--ha-delay": "820ms" } as React.CSSProperties}>
            <div className="flex">
              {["K", "N", "C"].map((l, i) => (
                <div key={i} className={`w-6 h-6 rounded-full bg-primary/15 border-2 border-surface flex items-center justify-center text-[9px] font-black text-primary${i > 0 ? " -ml-1.5" : ""}`}>{l}</div>
              ))}
            </div>
            <span>Restaurants in <strong className="text-on-surface/70">Kigali · Nairobi · Kampala</strong> and beyond trust MENUZA AI</span>
          </div>
        </div>

        {/* Right — dual mockup: floating phone + AI Waiter chat */}
        <div className="hidden lg:flex bg-[#FFF8F4] items-center justify-center relative overflow-hidden">
          {/* Menu phone — wrapper fades in, inner div floats */}
          <div className="hero-animate" style={{ "--ha-delay": "500ms" } as React.CSSProperties}>
          <div className="animate-lp-float w-[190px] rounded-[2rem] p-4 shadow-2xl relative z-20 bg-white -translate-x-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-white icon-fill text-[12px]">restaurant_menu</span>
              </div>
              <p className="font-headline font-extrabold text-[0.7rem] text-on-surface tracking-tight">Kigali Grill</p>
            </div>
            <div className="h-[2px] bg-primary/20 rounded-full mb-3" />
            <p className="text-[0.52rem] font-bold text-secondary/50 uppercase tracking-wider mb-2">🍖 Mains</p>
            {[
              { name: "Brochette ya Nk'osa", price: "3,500", badge: "bestseller" },
              { name: "Isombe na Poisson",    price: "2,800", badge: "" },
              { name: "Igisafuriya cy'Inkoko",price: "4,200", badge: "new" },
              { name: "Chips na Viande",      price: "3,000", badge: "" },
            ].map(({ name, price, badge }) => (
              <div key={name} className="flex justify-between items-center py-1.5 border-b border-black/5 gap-1">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-on-surface/80 font-medium text-[0.48rem] truncate">{name}</span>
                  {badge && <span className="shrink-0 bg-primary/10 text-primary font-black px-1 py-px rounded text-[0.38rem] uppercase">{badge}</span>}
                </div>
                <span className="text-primary font-bold text-[0.48rem] shrink-0">{price}</span>
              </div>
            ))}
            <div className="mt-3 flex items-center justify-center gap-1.5 bg-primary/8 rounded-xl py-2">
              <span className="material-symbols-outlined text-primary icon-fill text-[12px]">add_shopping_cart</span>
              <span className="text-[0.45rem] font-black text-primary uppercase tracking-wider">Add to order</span>
            </div>
          </div>
          </div>

          {/* AI Waiter chat chip — absolute wrapper fades in, inner div floats */}
          <div className="hero-animate absolute right-6 top-1/2 -translate-y-[45%] z-30 w-[188px]" style={{ "--ha-delay": "680ms" } as React.CSSProperties}>
          <div className="animate-lp-float-chat">
            <div className="bg-on-surface rounded-[1.5rem] overflow-hidden shadow-2xl">
              <div className="bg-primary px-4 py-3 flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white icon-fill text-sm">robot_2</span>
                </div>
                <div>
                  <p className="text-white font-bold text-[0.65rem]">AI Digital Waiter</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <p className="text-white/60 text-[0.48rem] font-semibold">Online now</p>
                  </div>
                </div>
              </div>
              <div className="px-3 py-3 space-y-2.5 bg-surface-container-lowest">
                <div className="msg-animate bg-surface-container rounded-xl rounded-tl-sm px-3 py-2 max-w-[88%]" style={{ "--msg-delay": "1000ms" } as React.CSSProperties}>
                  <p className="text-[0.52rem] text-on-surface leading-relaxed">Good evening! Welcome to Kigali Grill 🍽️ What can I get you?</p>
                </div>
                <div className="msg-animate flex justify-end" style={{ "--msg-delay": "1700ms" } as React.CSSProperties}>
                  <div className="bg-primary rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                    <p className="text-[0.52rem] text-white">What&apos;s popular tonight?</p>
                  </div>
                </div>
                {/* Typing indicator briefly before response */}
                <div className="msg-animate bg-surface-container rounded-xl rounded-tl-sm px-3 py-2 max-w-[88%]" style={{ "--msg-delay": "2400ms" } as React.CSSProperties}>
                  <p className="text-[0.52rem] text-on-surface leading-relaxed">Our <strong>Brochette ya Nk&apos;osa</strong> is tonight&apos;s bestseller ⭐ Shall I add it for you?</p>
                </div>
              </div>
              <div className="px-3 pb-3 pt-1 bg-surface-container-lowest flex gap-1.5">
                <div className="flex-1 bg-surface-container rounded-lg px-2.5 py-2 text-[0.44rem] text-secondary/30">Ask anything…</div>
                <button type="button" className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white text-[11px]">send</span>
                </button>
              </div>
            </div>
            {/* Order confirmed float */}
            <div className="msg-animate mt-2.5 bg-white rounded-xl shadow-lg border border-black/6 px-3 py-2 flex items-center gap-2" style={{ "--msg-delay": "3100ms" } as React.CSSProperties}>
              <span className="material-symbols-outlined text-tertiary text-base icon-fill">check_circle</span>
              <div>
                <p className="text-[0.55rem] font-black text-on-surface">Order confirmed</p>
                <p className="text-[0.45rem] text-secondary">Kitchen notified · 8:12 PM</p>
              </div>
            </div>
          </div>
          </div>

          <span className="absolute bottom-6 left-6 select-none pointer-events-none leading-none font-headline font-extrabold text-[5.5rem] text-primary opacity-[0.06]">
            LIVE
          </span>
        </div>
        </div>
      </section>

      {/* ── Progress Strip ── */}
      <div className="bg-on-surface">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={i} className="px-8 py-8 border-r border-white/10 last:border-r-0 col-span-1">
              <p className="text-primary leading-none mb-2 font-headline font-extrabold text-[2rem]">{step.num}</p>
              <p className="text-sm font-semibold text-surface/90 mb-0.5">{step.label}</p>
              <p className="text-xs text-surface/40">{step.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust Band ── */}
      <div
        ref={trustRef as React.RefObject<HTMLDivElement>}
        className="py-7 px-6 bg-surface-container-lowest border-b border-black/5"
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className={`reveal text-sm font-semibold text-secondary/60 shrink-0${trustInView ? " visible" : ""}`}>
            Live menus serving guests in
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CITIES.map((city, i) => (
              <span
                key={city}
                className={`${trustInView ? "pop-animate" : "opacity-0"} text-xs font-bold text-secondary/70 bg-surface border border-black/6 px-3 py-1.5 rounded-full shadow-sm`}
                style={trustInView ? { "--pa-delay": `${i * 80}ms` } as React.CSSProperties : undefined}
              >
                {city}
              </span>
            ))}
          </div>
          <LiveStats inline />
        </div>
      </div>

      {/* ── Value Proposition ── */}
      <section
        ref={valueRef as React.RefObject<HTMLElement>}
        className="py-24 bg-surface px-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className={`${rv("up", valueInView)} text-xs font-bold tracking-[0.25em] uppercase text-secondary/40 mb-4`}>The Problem</p>
            <h2 className={`${rv("up", valueInView)} text-4xl md:text-5xl font-black tracking-tight mb-5`} style={{ "--rv-delay": "80ms" } as React.CSSProperties}>
              Most menus just list.<br />Yours should <span className="text-shimmer">sell.</span>
            </h2>
            <p className={`reveal${valueInView ? " visible" : ""} text-secondary text-lg max-w-xl mx-auto leading-relaxed`} style={{ "--rv-delay": "160ms" } as React.CSSProperties}>
              Every day you hand a customer a paper menu or a broken PDF link, you lose a sale.
              MENUZA AI turns your menu into an always-on, AI-powered revenue machine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                delay: "0ms", bg: "bg-surface-container-lowest border border-black/5",
                icon: <div className="w-10 h-10 bg-error/10 text-error rounded-xl flex items-center justify-center mb-6"><span className="material-symbols-outlined text-xl">visibility_off</span></div>,
                title: "Flying Blind", dark: false,
                body: "You don't know which dishes get viewed but never ordered. Every restock, every menu change — pure guesswork. That's money left on the table every single day.",
              },
              {
                delay: "120ms", bg: "bg-on-surface relative overflow-hidden",
                icon: <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-6 relative"><span className="material-symbols-outlined text-white text-xl icon-fill">auto_awesome</span></div>,
                title: "MENUZA AI flips the script", dark: true,
                body: "AI menu design. Real-time orders. An AI Waiter that upsells for you. Analytics that show what's actually working. One platform, no integrations needed.",
              },
              {
                delay: "240ms", bg: "bg-surface-container-lowest border border-black/5",
                icon: <div className="w-10 h-10 bg-tertiary/10 text-tertiary rounded-xl flex items-center justify-center mb-6"><span className="material-symbols-outlined text-xl">qr_code_2</span></div>,
                title: "Scan. Chat. Order. Done.", dark: false,
                body: "No app downloads. Guests scan your QR code, chat with your AI Waiter, and place their order — in under 30 seconds. Zero friction for them. Zero staff cost for you.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className={`reveal${valueInView ? " visible" : ""} ${card.bg} p-8 rounded-3xl`}
                style={{ "--rv-delay": card.delay } as React.CSSProperties}
              >
                {card.bg.includes("on-surface") && <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent pointer-events-none" />}
                {card.icon}
                <h3 className={`font-headline text-lg font-bold mb-3 relative${card.dark ? " text-white" : ""}`}>{card.title}</h3>
                <p className={`text-sm leading-relaxed relative${card.dark ? " text-white/50" : " text-secondary"}`}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Waiter Showcase ── */}
      <section
        ref={waiterRef as React.RefObject<HTMLElement>}
        className="py-28 px-6 bg-surface-container-lowest border-y border-black/5"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className={`reveal-left${waiterInView ? " visible" : ""}`}>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-primary/70 mb-5">AI Digital Waiter</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.06] mb-5">
              Your best waiter.<br />Works every shift.
            </h2>
            <p className="text-secondary text-lg leading-relaxed mb-4 max-w-md">
              The moment a customer scans your QR code, your AI Waiter greets them, answers every question,
              upsells your best dishes, and places their order. All in chat. Zero staff time.
            </p>
            <p className="text-on-surface font-bold text-sm mb-8 max-w-md">
              Never calls in sick. Never forgets to upsell. Never has a bad shift.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                { icon: "schedule",    text: "Available 24/7 — never calls in sick, never asks for overtime" },
                { icon: "trending_up", text: "Proactively suggests high-margin add-ons on every single order" },
                { icon: "translate",   text: "Adapts tone to your brand — friendly, formal, or vibrant" },
                { icon: "rate_review", text: "Follows up after the meal to prompt happy guests to leave a review" },
              ].map((item) => (
                <li key={item.icon} className="flex items-center gap-3 text-sm text-secondary">
                  <span className="material-symbols-outlined text-[18px] text-primary shrink-0">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-3">
              <Link href="/demo" className="px-6 py-3 bg-primary text-white font-bold rounded-[2rem] text-sm hover:bg-[#a04100] transition-colors shadow-md shadow-primary/20">
                Try AI Waiter live
              </Link>
              <span className="text-xs text-secondary/50">Included in Pro &amp; Business plans</span>
            </div>
          </div>

          {/* Chat mockup */}
          <div className={`reveal-right${waiterInView ? " visible" : ""} relative`}>
            <div className="bg-on-surface rounded-[2rem] overflow-hidden shadow-2xl max-w-sm mx-auto">
              <div className="bg-primary px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white text-xl icon-fill">robot_2</span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">AI Digital Waiter</p>
                  <p className="text-white/60 text-[10px] uppercase tracking-widest font-black">Kigali Grill</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/40 text-[10px]">Online</span>
                </div>
              </div>

              <div className="px-4 py-5 space-y-4 bg-surface-container-lowest">
                {[
                  { role: "ai",   text: <>Good evening! Welcome to Kigali Grill 🍽️ I&apos;m your digital waiter. What can I get for you tonight?</> },
                  { role: "user", text: <>What&apos;s your most popular dish?</> },
                  { role: "ai",   text: <>Our guests love the <strong>Grilled Tilapia</strong> 🐟 — crispy skin, served with plantain and kachumbari. Tonight&apos;s bestseller! Shall I add it?</> },
                  { role: "user", text: <>Yes! And a Fanta please.</> },
                  { role: "ai",   text: <>Perfect! 🛎️ <strong>Grilled Tilapia + Fanta Orange</strong> — 7,500 RWF. Sending your order to the kitchen now…</> },
                ].map((msg, i) => (
                  msg.role === "ai" ? (
                    <div key={i} className="flex items-end gap-2">
                      <div className="w-7 h-7 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-sm icon-fill">robot_2</span>
                      </div>
                      <div className="bg-surface-container rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%]">
                        <p className="text-xs text-on-surface leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex justify-end">
                      <div className="bg-primary rounded-2xl rounded-br-sm px-4 py-3 max-w-[75%]">
                        <p className="text-xs text-white leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  )
                ))}
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
              <span className="material-symbols-outlined text-tertiary text-xl icon-fill">check_circle</span>
              <div>
                <p className="text-xs font-black text-on-surface">Order confirmed</p>
                <p className="text-[10px] text-secondary">Sent to kitchen · 8:47 PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section
        ref={featuresRef as React.RefObject<HTMLElement>}
        className="py-28 px-6"
        id="features"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className={`reveal${featuresInView ? " visible" : ""} text-xs font-bold tracking-[0.25em] uppercase text-secondary/40 mb-4`}>Features</p>
            <h2 className={`reveal${featuresInView ? " visible" : ""} text-4xl font-black tracking-tight mb-5`} style={{ "--rv-delay": "100ms" } as React.CSSProperties}>
              Everything you need to run a great restaurant
            </h2>
            <p className={`reveal${featuresInView ? " visible" : ""} text-secondary text-lg leading-relaxed`} style={{ "--rv-delay": "180ms" } as React.CSSProperties}>
              One platform. No integrations. No subscriptions for tools you won&apos;t use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`reveal${featuresInView ? " visible" : ""} flex items-start gap-5 py-7 border-b border-black/6`}
                style={{ "--rv-delay": `${Math.floor(i / 2) * 100 + 200}ms` } as React.CSSProperties}
              >
                <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center mt-0.5 ${f.highlight ? "bg-primary" : "bg-primary/8"}`}>
                  <span className={`material-symbols-outlined text-xl icon-fill ${f.highlight ? "text-white" : "text-primary"}`}>{f.icon}</span>
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

          <div className={`reveal${featuresInView ? " visible" : ""} mt-8 text-center`} style={{ "--rv-delay": "500ms" } as React.CSSProperties}>
            <Link href={ctaHref} className="inline-block px-7 py-3.5 bg-primary text-white font-bold rounded-[2rem] text-sm hover:bg-[#a04100] transition-colors">
              Start building your menu →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Outcomes ── */}
      <section
        ref={outcomesRef as React.RefObject<HTMLElement>}
        className="py-20 px-6 bg-surface-container-lowest border-y border-black/5"
      >
        <div className="max-w-7xl mx-auto">
          <p className={`reveal${outcomesInView ? " visible" : ""} text-center text-xs font-bold tracking-[0.25em] uppercase text-secondary/40 mb-12`}>What you get</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { stat: count7 > 0 || outcomesInView ? `${count7}s` : "0s", label: "Menu digitized",    desc: "From paper photo to live QR menu in under 7 seconds with AI extraction.",                      icon: "bolt",       delay: "0ms"   },
              { stat: "24/7",                                               label: "AI Waiter on duty", desc: "Your digital waiter takes orders around the clock — no sick days, no overtime.",             icon: "support_agent", delay: "120ms" },
              { stat: "0",                                                  label: "Apps to download",  desc: "Guests scan a QR code, browse, and order. No friction. No barriers. No app store.",          icon: "qr_code_2",  delay: "240ms" },
              { stat: count14 > 0 || outcomesInView ? `${count14}` : "0",  label: "Day free trial",    desc: "Full Pro features, no credit card. Don't love it? Walk away — no questions asked.",          icon: "verified",   delay: "360ms" },
            ].map((o, i) => (
              <div
                key={i}
                className={`${outcomesInView ? "stat-animate" : "opacity-0"} text-center p-6 bg-surface rounded-3xl border border-black/5 shadow-sm`}
                style={outcomesInView ? { "--sa-delay": o.delay } as React.CSSProperties : undefined}
              >
                <span className="material-symbols-outlined text-primary text-3xl icon-fill mb-3 block">{o.icon}</span>
                <p className="font-headline font-extrabold text-4xl text-on-surface mb-1 tabular-nums">{o.stat}</p>
                <p className="text-sm font-bold text-on-surface mb-2">{o.label}</p>
                <p className="text-xs text-secondary leading-relaxed">{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo Video ── */}
      <section
        ref={demoRef as React.RefObject<HTMLElement>}
        className="py-24 px-6"
        id="demo"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className={`reveal${demoInView ? " visible" : ""} text-xs font-bold tracking-[0.25em] uppercase text-secondary/40 mb-4`}>See It in Action</p>
            <h2 className={`reveal${demoInView ? " visible" : ""} text-4xl font-black tracking-tight mb-4`} style={{ "--rv-delay": "100ms" } as React.CSSProperties}>
              From chaos to live menu in 90 seconds
            </h2>
            <p className={`reveal${demoInView ? " visible" : ""} text-secondary max-w-md mx-auto`} style={{ "--rv-delay": "180ms" } as React.CSSProperties}>
              Watch a restaurant owner photograph their old paper menu, let AI extract every item, and go live — start to finish.
            </p>
          </div>
          <div className={`reveal${demoInView ? " visible" : ""} rounded-3xl overflow-hidden shadow-2xl border border-black/8 aspect-video bg-on-surface`} style={{ "--rv-delay": "260ms" } as React.CSSProperties}>
            {demoInView ? (
              <video
                poster="https://img.youtube.com/vi/G4vp5NQnk-I/maxresdefault.jpg"
                controls
                preload="none"
                playsInline
                className="w-full h-full object-cover"
              >
                <source src="/menuza-demo.mp4" type="video/mp4" />
              </video>
            ) : (
              <div className="w-full h-full bg-on-surface/5" />
            )}
          </div>
          <p className="text-center mt-4 text-xs text-secondary/50">90 seconds · Photo → AI extraction → live QR menu → staff dashboard</p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section
        ref={pricingRef as React.RefObject<HTMLElement>}
        className="py-24 px-6 bg-surface-container-lowest border-y border-black/5"
        id="pricing"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className={`reveal${pricingInView ? " visible" : ""} text-xs font-bold tracking-[0.25em] uppercase text-secondary/40 mb-4`}>Pricing</p>
            <h2 className={`reveal${pricingInView ? " visible" : ""} text-4xl font-black tracking-tight mb-4`} style={{ "--rv-delay": "80ms" } as React.CSSProperties}>
              Start free. Upgrade when you&apos;re ready.
            </h2>
            <p className={`reveal${pricingInView ? " visible" : ""} text-secondary`} style={{ "--rv-delay": "140ms" } as React.CSSProperties}>
              14-day free trial — no credit card, no commitment. Cancel anytime.
            </p>
          </div>

          <div className={`reveal${pricingInView ? " visible" : ""} flex justify-center mb-10`} style={{ "--rv-delay": "180ms" } as React.CSSProperties}>
            <div className="inline-flex items-center bg-surface border border-black/8 rounded-xl p-1 shadow-sm">
              <button type="button" onClick={() => setIsAnnual(false)} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${!isAnnual ? "bg-on-surface text-surface shadow-sm" : "text-secondary hover:text-on-surface"}`}>
                Monthly
              </button>
              <button type="button" onClick={() => setIsAnnual(true)} className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2.5 cursor-pointer ${isAnnual ? "bg-on-surface text-surface shadow-sm" : "text-secondary hover:text-on-surface"}`}>
                Annual
                <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full transition-colors ${isAnnual ? "bg-white/15 text-white" : "bg-primary/10 text-primary"}`}>Save 1 month</span>
              </button>
            </div>
          </div>

          {/* Free Lite strip */}
          <div className={`reveal${pricingInView ? " visible" : ""} flex flex-wrap items-center justify-between gap-4 bg-surface border border-black/6 rounded-2xl px-6 py-4 mb-6 shadow-sm`} style={{ "--rv-delay": "220ms" } as React.CSSProperties}>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary/50">Free Lite</span>
              <span className="text-sm font-bold text-on-surface">0 RWF forever</span>
              <span className="text-secondary/30 hidden sm:inline">·</span>
              {pricingPlans[0].features.map((f, j) => (
                <span key={j} className="text-xs text-secondary/60 hidden sm:inline">
                  {f}{j < pricingPlans[0].features.length - 1 && <span className="text-secondary/25 ml-2">·</span>}
                </span>
              ))}
            </div>
            <Link href={ctaHref} className="shrink-0 text-xs font-bold text-secondary hover:text-primary transition-colors flex items-center gap-1">
              Start free trial
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {pricingPlans.filter(plan => plan.amountRwf > 0).map((plan, i) => {
              const displayPrice = `${fmt(plan.amountRwf * (isAnnual ? 11 : 1))} RWF`;
              const displayPeriod = isAnnual ? "/ year" : "/ month";
              const pricingHref = `/pricing${isAnnual ? "?billing=annual" : ""}`;
              return (
                <div
                  key={i}
                  className={`plan-card reveal${pricingInView ? " visible" : ""} rounded-3xl p-8 flex flex-col relative ${plan.popular ? "bg-on-surface shadow-xl shadow-black/15" : "bg-surface border border-black/6"}`}
                  style={{ "--rv-delay": `${280 + i * 120}ms` } as React.CSSProperties}
                >
                  {plan.popular && (
                    <>
                      <div className="absolute -top-px left-0 right-0 h-px bg-linear-to-r from-transparent via-primary to-transparent rounded-t-3xl" />
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-white text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-md whitespace-nowrap">Most Popular</span>
                      </div>
                    </>
                  )}
                  <p className={`text-xs font-bold tracking-[0.2em] uppercase mb-3 ${plan.popular ? "text-white/40" : "text-secondary/60"}`}>{plan.name}</p>
                  <div className="mb-6">
                    <span className={`text-4xl font-black ${plan.popular ? "text-white" : ""}`}>{displayPrice}</span>
                    <span className={`text-sm ml-1.5 ${plan.popular ? "text-white/40" : "text-secondary"}`}>{displayPeriod}</span>
                    {isAnnual ? (
                      <p className={`text-xs mt-1 font-semibold ${plan.popular ? "text-primary" : "text-primary/80"}`}>Save {fmt(plan.amountRwf)} RWF vs monthly</p>
                    ) : plan.popular && (
                      <p className="text-xs mt-1 text-white/30">Pay annually and save {fmt(plan.amountRwf)} RWF</p>
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
                  <Link href={pricingHref} className={`block w-full py-3.5 text-center text-sm font-bold rounded-[2rem] transition-colors ${plan.popular ? "bg-primary text-white hover:bg-[#a04100]" : "border border-black/10 text-on-surface hover:bg-black/3"}`}>
                    {plan.cta}
                  </Link>
                  {plan.popular && (
                    <p className="text-center mt-3 text-[10px] text-white/30 flex items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">verified</span>
                      14-day money-back guarantee
                    </p>
                  )}
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
        <div
          ref={ctaRef as React.RefObject<HTMLDivElement>}
          className={`reveal${ctaInView ? " visible" : ""} max-w-3xl mx-auto bg-on-surface rounded-3xl px-12 py-20 text-center relative overflow-hidden`}
        >
          <div className="absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-transparent pointer-events-none" />
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/30 mb-6 relative">Get started today</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight mb-5 relative">
            Your competitors went digital.<br />
            <span className="text-primary">Will you?</span>
          </h2>
          <p className="text-white/40 text-base mb-6 leading-relaxed max-w-lg mx-auto relative">
            Every day without a digital menu is a day you&apos;re invisible online, taking orders by hand,
            and guessing what sells. Start free today — no credit card, no catch.
          </p>
          <LiveStats />
          <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
            <Link href={ctaHref} className="px-8 py-4 bg-primary text-white font-bold rounded-[2rem] text-sm hover:bg-[#a04100] transition-colors shadow-lg shadow-primary/20">
              Start Free Trial — No Card Required
            </Link>
            <a href="mailto:support@menuzaai.com" className="px-8 py-4 bg-white/8 text-white/60 font-bold rounded-[2rem] text-sm hover:bg-white/12 transition-colors border border-white/10">
              Talk to Sales
            </a>
          </div>
          <p className="text-white/20 text-xs mt-5 relative">14-day free trial · Cancel anytime · Built for Africa</p>
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

function LiveStats({ inline }: { inline?: boolean }) {
  const [stats, setStats] = useState<{ restaurants: number; orders: number } | null>(null);

  useEffect(() => {
    fetch("/api/public/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (inline) {
    if (!stats || stats.restaurants < 5) return null;
    return (
      <div className="flex items-center gap-3 text-xs text-secondary/60 shrink-0">
        <span><strong className="text-on-surface/70">{fmt(stats.restaurants)}+</strong> restaurants live</span>
        {stats.orders >= 500 && (
          <>
            <span className="w-px h-3 bg-black/10" />
            <span><strong className="text-on-surface/70">{fmt(stats.orders)}+</strong> orders</span>
          </>
        )}
      </div>
    );
  }

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
