"use client";

import Link from "next/link";
import Image from "next/image";
import { pricingPlans } from "@/data/mockData";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Top Navigation */}
      <nav className="w-full sticky top-0 z-50 bg-surface/80 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-8">
            <span className="text-2xl font-[var(--font-headline)] font-black tracking-tight text-primary-container">MENUZA AI</span>
            <div className="hidden md:flex gap-6 items-center">
              <Link className="text-primary-container font-bold border-b-2 border-primary-container font-[var(--font-headline)] text-sm" href="/">Home</Link>
              <a className="text-secondary hover:bg-primary-container/5 transition-colors font-[var(--font-headline)] font-medium text-sm px-2 py-1 rounded" href="#features">Features</a>
              <a className="text-secondary hover:bg-primary-container/5 transition-colors font-[var(--font-headline)] font-medium text-sm px-2 py-1 rounded" href="#pricing">Pricing</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-secondary font-[var(--font-headline)] font-bold text-sm px-4 py-2 hover:bg-primary-container/5 rounded-xl transition-all">
              Log In
            </Link>
            <Link href="/login" className="hidden md:block px-6 py-2.5 text-sm font-bold text-white bg-primary-container rounded-xl shadow-lg shadow-primary-container/20 hover:shadow-xl active:scale-95 transition-all">
              Sign Up
            </Link>
            <Link href="/menu/demo" className="hidden md:flex items-center gap-1 text-secondary font-medium text-sm px-3 py-2 hover:bg-primary-container/5 rounded-xl transition-all">
              <span className="material-symbols-outlined text-sm">play_circle</span>
              Live Demo
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="z-10">
            <span className="inline-block py-1 px-4 rounded-full bg-primary-container/10 text-primary font-bold text-xs tracking-widest uppercase mb-6">
              The Digital Maître d&apos;
            </span>
            <h1 className="text-5xl md:text-7xl font-[var(--font-headline)] font-extrabold text-on-surface leading-[1.1] tracking-tighter mb-8">
              Turn your menu into a <span className="text-primary-container">money-making</span> machine
            </h1>
            <p className="text-xl text-secondary max-w-lg mb-10 leading-relaxed">
              Create, optimize, and track your restaurant menu with AI. Stop guessing and start selling with data-driven design.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/login" className="px-8 py-4 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary-container/20 active:scale-95 transition-all text-lg hover:shadow-xl">
                Start Free
              </Link>
              <Link href="/menu/demo" className="px-8 py-4 bg-surface-container-highest text-on-surface font-bold rounded-xl active:scale-95 transition-all text-lg hover:bg-surface-variant">
                See Demo
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary-container/20 rounded-full blur-3xl"></div>
            <div className="relative bg-surface-container-low rounded-[2rem] p-4 shadow-2xl border border-white/50 overflow-hidden">
              <div className="relative w-full h-[500px]">
                <Image
                  alt="Modern Restaurant Menu"
                  className="rounded-[1.5rem] object-cover"
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
              <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl flex items-center justify-between border border-primary-container/10 z-10">
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-tighter">Live Insight</p>
                  <p className="text-lg font-bold text-on-surface">Spicy Ramen conversion up 24%</p>
                </div>
                <span className="material-symbols-outlined text-tertiary text-3xl icon-fill">trending_up</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Solution Section */}
      <section className="py-24 bg-surface-container-low px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-[var(--font-headline)] font-black text-on-surface tracking-tight mb-4">
              Most menus don&apos;t sell — they just list.
            </h2>
            <p className="text-secondary text-lg max-w-2xl mx-auto">
              Traditional menus are static, blind, and hard to update. MENUZA AI turns them into active sales tools.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-surface-container-lowest p-8 rounded-[2rem] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-error/10 text-error rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined">mobiledata_off</span>
                </div>
                <h3 className="text-2xl font-[var(--font-headline)] font-bold mb-4">Zero Data</h3>
                <p className="text-secondary leading-relaxed">You have no idea which items people look at but never order. You&apos;re flying blind.</p>
              </div>
            </div>
            <div className="md:col-span-2 bg-gradient-to-br from-primary to-primary-container p-10 rounded-[2rem] text-white flex flex-col justify-center relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-3xl md:text-4xl font-[var(--font-headline)] font-black mb-6">MENUZA AI turns your menu into a sales tool.</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-white/50 text-3xl">psychology</span>
                    <div>
                      <p className="font-bold">AI Design</p>
                      <p className="text-white/80 text-sm">Automatically plates your items for maximum profit.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <span className="material-symbols-outlined text-white/50 text-3xl">speed</span>
                    <div>
                      <p className="font-bold">Real-time</p>
                      <p className="text-white/80 text-sm">Update prices or hide sold-out items instantly.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 opacity-10 scale-150 rotate-12">
                <span className="material-symbols-outlined text-[300px] icon-fill">restaurant_menu</span>
              </div>
            </div>
            <div className="md:col-span-2 bg-surface-container-highest p-10 rounded-[2rem] flex flex-col md:flex-row items-center gap-10">
              <div className="w-full md:w-1/3 relative aspect-square">
                <Image
                  alt="Analytics View"
                  className="rounded-2xl object-cover shadow-lg"
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="w-full md:w-2/3">
                <h3 className="text-2xl font-[var(--font-headline)] font-bold mb-4">Smart Insights</h3>
                <p className="text-secondary leading-relaxed mb-6">We track gaze patterns and click-through rates. Know exactly which photo drives the most orders.</p>
                <a href="#features" className="text-primary font-bold flex items-center gap-2 hover:translate-x-1 transition-transform">
                  See all features <span className="material-symbols-outlined">arrow_forward</span>
                </a>
              </div>
            </div>
            <div className="md:col-span-1 bg-surface-container-lowest p-8 rounded-[2rem] border border-outline-variant/10">
              <div className="w-12 h-12 bg-tertiary-container/10 text-tertiary rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined icon-fill">qr_code_2</span>
              </div>
              <h3 className="text-2xl font-[var(--font-headline)] font-bold mb-4">Scan &amp; Order</h3>
              <p className="text-secondary leading-relaxed">No apps to download. Customers scan, browse, and order in seconds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-surface" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl font-[var(--font-headline)] font-black tracking-tight mb-4">Powerful Features for Pro Restaurateurs</h2>
              <p className="text-secondary text-lg">Everything you need to run a high-performance digital menu.</p>
            </div>
            <a href="#features" className="px-6 py-3 border border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors">
              View all features
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: "upload_file", title: "Upload & Convert", desc: "Upload a photo of your paper menu. Our AI extracts every item, price, and description automatically." },
              { icon: "style", title: "Smart Templates", desc: "Choose from editorial-grade layouts designed to guide customers toward your highest-margin items." },
              { icon: "qr_code_scanner", title: "Custom QR Codes", desc: "Design branded QR codes that match your restaurant's aesthetic. High-resolution for print." },
              { icon: "leaderboard", title: "Live Analytics", desc: "Track menu views, item clicks, and order conversions in real-time from your dashboard." },
              { icon: "chat", title: "WhatsApp Orders", desc: "Direct connection to your kitchen. Orders land straight in your WhatsApp business account." },
              { icon: "notifications_active", title: "Order Notifications", desc: "Instant email alerts whenever a customer places an order, so you never miss a sale." },
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-3xl bg-surface-container hover:bg-surface-container-low transition-colors group cursor-pointer">
                <span className="material-symbols-outlined text-4xl text-primary mb-6 block group-hover:scale-110 transition-transform">{f.icon}</span>
                <h3 className="text-xl font-[var(--font-headline)] font-bold mb-3">{f.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 bg-surface-container-low" id="pricing">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-[var(--font-headline)] font-black mb-4">Simple, transparent pricing</h2>
            <p className="text-secondary">Pick the plan that fits your restaurant size.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {pricingPlans.map((plan, i) => (
              <div key={i} className={`bg-surface-container-lowest p-10 rounded-[2rem] flex flex-col ${plan.popular ? "border-2 border-primary-container relative md:scale-105 shadow-2xl z-10" : "border border-outline-variant/10"}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-container text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-[var(--font-headline)] font-bold mb-2">{plan.name}</h3>
                <div className="mb-8">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-secondary text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-10 flex-grow">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-3 text-sm ${plan.popular ? "text-on-surface" : "text-secondary"}`}>
                      <span className={`material-symbols-outlined ${plan.popular ? "text-primary icon-fill" : "text-tertiary-container"}`}>
                        check_circle
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className={`w-full py-4 font-bold rounded-xl transition-all text-center ${plan.popular
                  ? "bg-gradient-to-tr from-primary to-primary-container text-white shadow-lg shadow-primary-container/20 active:scale-95"
                  : "bg-surface-container-highest text-on-surface hover:bg-surface-variant"}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto bg-inverse-surface rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-[var(--font-headline)] font-black text-white mb-8 leading-tight">
              Your menu is your #1 sales tool. <br />
              <span className="text-primary-container">Upgrade it.</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/login" className="px-10 py-5 bg-primary-container text-white font-black rounded-2xl text-xl shadow-2xl active:scale-95 transition-all hover:shadow-primary-container/40 hover:shadow-xl">
                Get Started Now
              </Link>
              <a href="mailto:hello@ikoranabuhanga.tech" className="px-10 py-5 bg-white/10 text-white font-bold rounded-2xl text-xl backdrop-blur-md hover:bg-white/20 transition-all">
                Contact Us
              </a>
            </div>
          </div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px]"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-xl font-[var(--font-headline)] font-black tracking-tight text-primary-container">MENUZA AI</span>
            <p className="text-sm text-secondary">© 2026 Menuza Systems Inc. All rights reserved.</p>
          </div>
          <div className="flex gap-8 text-sm font-semibold text-on-surface-variant">
            <a className="hover:text-primary transition-colors" href="#">Terms</a>
            <a className="hover:text-primary transition-colors" href="#">Privacy</a>
            <a className="hover:text-primary transition-colors" href="mailto:hello@ikoranabuhanga.tech">Contact</a>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-xl">share</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-xl">group</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-end px-4 pb-6 bg-surface/90 backdrop-blur-xl border-t border-primary-container/10 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] rounded-t-[2rem]">
        <div className="flex flex-col items-center justify-center bg-gradient-to-tr from-primary to-primary-container text-white rounded-2xl p-3 mb-2 scale-110 shadow-lg shadow-primary-container/20">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-bold font-[var(--font-headline)] uppercase">Home</span>
        </div>
        <Link href="/dashboard/menus" className="flex flex-col items-center justify-center text-secondary p-2">
          <span className="material-symbols-outlined">menu_book</span>
          <span className="text-[10px] font-bold font-[var(--font-headline)] uppercase">Menus</span>
        </Link>
        <Link href="/menu/demo" className="flex flex-col items-center justify-center text-secondary p-2">
          <span className="material-symbols-outlined">qr_code_scanner</span>
          <span className="text-[10px] font-bold font-[var(--font-headline)] uppercase">Scan</span>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center justify-center text-secondary p-2">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-bold font-[var(--font-headline)] uppercase">Profile</span>
        </Link>
      </div>
    </div>
  );
}
