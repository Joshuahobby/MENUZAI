"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";

interface SubscriptionData {
  plans: { trial: number; free: number; pro: number; business: number };
  mrr: { pro: number; business: number; total: number };
  prices: { pro: number; business: number };
}

function fmtRwf(amount: number) {
  return new Intl.NumberFormat("en-RW").format(amount) + " RWF";
}

const PLAN_CARDS = [
  {
    key: "trial" as const,
    label: "Free Trial",
    price: "Free",
    period: "14 days",
    badgeClass: "bg-violet-100 text-violet-700",
    headerBg: "bg-violet-50",
    accentIcon: "text-violet-500",
    icon: "hourglass_empty",
    description: "New accounts — full Pro access during trial window.",
    features: [
      "Unlimited Menus",
      "AI Menu Extraction",
      "AI Digital Waiter",
      "Staff Roles & Permissions",
      "Premium QR Templates",
      "Live Analytics",
    ],
    planFilter: "free",
    checkIcon: "text-violet-500",
  },
  {
    key: "free" as const,
    label: "Free Lite",
    price: "Free",
    period: "after trial",
    badgeClass: "bg-slate-100 text-slate-600",
    headerBg: "bg-slate-50",
    accentIcon: "text-slate-400",
    icon: "lock_open",
    description: "Trial expired — public menu with MENUZA AI branding.",
    features: [
      "1 Digital Menu",
      "QR Code Generation",
      "WhatsApp Ordering",
      "Powered by MENUZA AI (branding)",
    ],
    planFilter: "free",
    checkIcon: "text-slate-400",
  },
  {
    key: "pro" as const,
    label: "Pro",
    price: "35,000 RWF",
    period: "/ month",
    badgeClass: "bg-primary/10 text-primary",
    headerBg: "bg-primary/5",
    accentIcon: "text-primary",
    icon: "workspace_premium",
    description: "Full AI features for growing restaurants.",
    features: [
      "Unlimited Menus",
      "AI Menu Extraction",
      "AI Digital Waiter",
      "Real-time Order Management",
      "Live Analytics (90 days)",
      "Staff Roles & Permissions",
    ],
    planFilter: "pro",
    checkIcon: "text-primary",
  },
  {
    key: "business" as const,
    label: "Business",
    price: "89,000 RWF",
    period: "/ month",
    badgeClass: "bg-tertiary/10 text-tertiary",
    headerBg: "bg-tertiary/5",
    accentIcon: "text-tertiary",
    icon: "domain",
    description: "Multi-location support for restaurant groups.",
    features: [
      "Everything in Pro",
      "Up to 5 Locations",
      "Custom Domain Mapping",
      "Priority Support",
      "Dedicated Account Support",
    ],
    planFilter: "business",
    checkIcon: "text-tertiary",
  },
];

export default function AdminSubscriptionsPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d); })
      .catch(() => toast.error("Failed to load subscription data"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-on-surface tracking-tight">Subscription Packages</h1>
        <p className="text-sm text-secondary mt-0.5">Plan definitions, live subscriber counts, and revenue overview.</p>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white border border-black/6 rounded-2xl animate-pulse" />
          ))
        ) : (
          <>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Est. Monthly Revenue</p>
              <p className="text-2xl font-extrabold font-[var(--font-headline)]">
                {data ? fmtRwf(data.mrr.total) : "—"}
              </p>
              <p className="text-xs text-white/40 mt-1">From active paid plans</p>
            </div>
            <div className="bg-white border border-black/6 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Pro Subscribers</p>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[16px] icon-fill">workspace_premium</span>
                </div>
              </div>
              <p className="text-2xl font-extrabold font-[var(--font-headline)] text-on-surface">
                {data?.plans.pro ?? 0}
              </p>
              <p className="text-xs text-secondary mt-1">{data ? fmtRwf(data.mrr.pro) : "—"} / mo</p>
            </div>
            <div className="bg-white border border-black/6 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Business Subscribers</p>
                <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-tertiary text-[16px] icon-fill">domain</span>
                </div>
              </div>
              <p className="text-2xl font-extrabold font-[var(--font-headline)] text-on-surface">
                {data?.plans.business ?? 0}
              </p>
              <p className="text-xs text-secondary mt-1">{data ? fmtRwf(data.mrr.business) : "—"} / mo</p>
            </div>
          </>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {PLAN_CARDS.map(plan => {
          const count = data?.plans[plan.key] ?? 0;
          return (
            <div key={plan.key} className="bg-white border border-black/6 rounded-2xl shadow-sm flex flex-col overflow-hidden">
              {/* Header */}
              <div className={`p-5 ${plan.headerBg}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${plan.badgeClass}`}>
                    {plan.label}
                  </span>
                  <span className={`material-symbols-outlined text-[20px] icon-fill ${plan.accentIcon}`}>
                    {plan.icon}
                  </span>
                </div>
                <p className="text-lg font-extrabold font-[var(--font-headline)] text-on-surface leading-tight">
                  {plan.price}
                  {plan.period && (
                    <span className="text-xs font-medium text-secondary ml-1.5">{plan.period}</span>
                  )}
                </p>
                <p className="text-[11px] text-secondary mt-1.5 leading-snug">{plan.description}</p>
              </div>

              {/* Subscriber count row */}
              <div className="px-5 py-3 border-b border-black/6 flex items-center justify-between">
                <span className="text-xs text-secondary">Active subscribers</span>
                {loading ? (
                  <div className="w-8 h-5 bg-surface-container rounded animate-pulse" />
                ) : (
                  <span className="text-sm font-extrabold text-on-surface">{count}</span>
                )}
              </div>

              {/* Features */}
              <ul className="p-5 space-y-2 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-secondary">
                    <span className={`material-symbols-outlined text-[13px] mt-0.5 shrink-0 icon-fill ${plan.checkIcon}`}>
                      check_circle
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* View subscribers link */}
              <div className="px-5 pb-5">
                <Link
                  href={`/admin/restaurants?plan=${plan.planFilter}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-container hover:bg-surface-container-highest text-on-surface text-xs font-bold rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">group</span>
                  View subscribers
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pricing note */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200/60 rounded-2xl p-4">
        <span className="material-symbols-outlined text-amber-500 text-[18px] shrink-0 mt-0.5 icon-fill">info</span>
        <div>
          <p className="text-xs font-bold text-amber-800 mb-0.5">Pricing is defined in code</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Plan prices (Pro: 35,000 RWF · Business: 89,000 RWF) are set in{" "}
            <code className="font-mono bg-amber-100 px-1 rounded">src/app/api/payments/pawapay/route.ts</code>
            {" "}and{" "}
            <code className="font-mono bg-amber-100 px-1 rounded">src/data/mockData.ts</code>.
            Update both files and redeploy to change pricing. For per-restaurant overrides, use the{" "}
            <Link href="/admin/restaurants" className="font-bold underline">Restaurants</Link> page.
          </p>
        </div>
      </div>
    </div>
  );
}
