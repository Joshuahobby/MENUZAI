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
    priceLabel: "Free",
    period: "14 days",
    badgeClass: "bg-primary/15 text-primary",
    headerBg: "bg-primary/5",
    iconClass: "text-primary",
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
  },
  {
    key: "free" as const,
    label: "Free Lite",
    priceLabel: "Free",
    period: "after trial",
    badgeClass: "bg-surface-container-low text-secondary",
    headerBg: "bg-surface-container-low",
    iconClass: "text-secondary/60",
    icon: "lock_open",
    description: "Trial expired — public menu with MENUZA AI branding.",
    features: [
      "1 Digital Menu",
      "QR Code Generation",
      "WhatsApp Ordering",
      "MENUZA AI branding shown",
    ],
    planFilter: "free",
  },
  {
    key: "pro" as const,
    label: "Pro",
    priceLabel: null,
    period: "/ month",
    badgeClass: "bg-primary/10 text-primary",
    headerBg: "bg-primary/5",
    iconClass: "text-primary",
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
  },
  {
    key: "business" as const,
    label: "Business",
    priceLabel: null,
    period: "/ month",
    badgeClass: "bg-tertiary/10 text-tertiary",
    headerBg: "bg-tertiary/5",
    iconClass: "text-tertiary",
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
  },
];

export default function AdminSubscriptionsPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [proPrice, setProPrice] = useState("");
  const [businessPrice, setBusinessPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/subscriptions")
      .then(r => r.json())
      .then(d => {
        if (d.error) return;
        setData(d);
        setProPrice(String(d.prices.pro));
        setBusinessPrice(String(d.prices.business));
        setDirty(false);
      })
      .catch(() => toast.error("Failed to load subscription data"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handlePriceChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setDirty(true);
  };

  const handleSave = async () => {
    const pro = parseInt(proPrice, 10);
    const business = parseInt(businessPrice, 10);
    if (isNaN(pro) || isNaN(business)) {
      toast.error("Enter valid numbers for both prices");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pro, business }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      toast.success("Prices updated");
      setDirty(false);
      load();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const getCount = (key: keyof SubscriptionData["plans"]) => data?.plans[key] ?? 0;
  const getDisplayPrice = (key: "pro" | "business") =>
    data ? fmtRwf(data.prices[key]) : "—";

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-on-surface tracking-tight">Subscription Packages</h1>
          <p className="text-sm text-secondary mt-0.5">Live subscriber counts, revenue, and plan pricing.</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-secondary bg-surface-container-lowest border border-black/6 hover:bg-surface-container rounded-xl shadow-sm transition-colors disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>sync</span>
          Refresh
        </button>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {loading && !data ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-surface-container-lowest border border-black/6 rounded-2xl animate-pulse" />
          ))
        ) : (
          <>
            <div className="bg-on-surface rounded-2xl p-5 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Est. Monthly Revenue</p>
              <p className="text-2xl font-extrabold font-headline">
                {data ? fmtRwf(data.mrr.total) : "—"}
              </p>
              <p className="text-xs text-white/40 mt-1">From active paid plans</p>
            </div>
            <div className="bg-surface-container-lowest border border-black/6 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Pro Subscribers</p>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[16px] icon-fill">workspace_premium</span>
                </div>
              </div>
              <p className="text-2xl font-extrabold font-headline text-on-surface">{getCount("pro")}</p>
              <p className="text-xs text-secondary mt-1">{data ? fmtRwf(data.mrr.pro) : "—"} / mo</p>
            </div>
            <div className="bg-surface-container-lowest border border-black/6 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Business Subscribers</p>
                <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-tertiary text-[16px] icon-fill">domain</span>
                </div>
              </div>
              <p className="text-2xl font-extrabold font-headline text-on-surface">{getCount("business")}</p>
              <p className="text-xs text-secondary mt-1">{data ? fmtRwf(data.mrr.business) : "—"} / mo</p>
            </div>
          </>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {PLAN_CARDS.map(plan => {
          const count = getCount(plan.key);
          const dynamicPrice =
            plan.key === "pro" ? getDisplayPrice("pro")
            : plan.key === "business" ? getDisplayPrice("business")
            : plan.priceLabel ?? "Free";

          return (
            <div key={plan.key} className="bg-surface-container-lowest border border-black/6 rounded-2xl flex flex-col overflow-hidden">
              <div className={`p-5 ${plan.headerBg}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${plan.badgeClass}`}>
                    {plan.label}
                  </span>
                  <span className={`material-symbols-outlined text-[20px] icon-fill ${plan.iconClass}`}>
                    {plan.icon}
                  </span>
                </div>
                <p className="text-lg font-extrabold font-headline text-on-surface leading-tight">
                  {dynamicPrice}
                  <span className="text-xs font-medium text-secondary ml-1.5">{plan.period}</span>
                </p>
                <p className="text-[11px] text-secondary mt-1.5 leading-snug">{plan.description}</p>
              </div>

              <div className="px-5 py-3 border-b border-black/6 flex items-center justify-between">
                <span className="text-xs text-secondary">Active subscribers</span>
                {loading && !data ? (
                  <div className="w-8 h-5 bg-surface-container rounded animate-pulse" />
                ) : (
                  <span className="text-sm font-extrabold text-on-surface">{count}</span>
                )}
              </div>

              <ul className="p-5 space-y-2 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-secondary">
                    <span className={`material-symbols-outlined text-[13px] mt-0.5 shrink-0 icon-fill ${plan.iconClass}`}>
                      check_circle
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

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

      {/* Pricing editor */}
      <div className="bg-surface-container-lowest border border-black/6 rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[18px] icon-fill">sell</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface">Edit Plan Prices</p>
            <p className="text-xs text-secondary mt-0.5">Changes take effect immediately for new payments.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label htmlFor="price-pro" className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2 block">
              Pro Price (RWF / month)
            </label>
            <div className="relative">
              <input
                id="price-pro"
                type="number"
                min="1000"
                step="1000"
                value={proPrice}
                onChange={handlePriceChange(setProPrice)}
                disabled={saving || loading}
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary pointer-events-none">RWF</span>
            </div>
          </div>
          <div>
            <label htmlFor="price-business" className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2 block">
              Business Price (RWF / month)
            </label>
            <div className="relative">
              <input
                id="price-business"
                type="number"
                min="1000"
                step="1000"
                value={businessPrice}
                onChange={handlePriceChange(setBusinessPrice)}
                disabled={saving || loading}
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary pointer-events-none">RWF</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || !dirty}
            className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save Prices"}
          </button>
          {!dirty && !saving && data && (
            <p className="text-xs text-secondary">
              Current: Pro {fmtRwf(data.prices.pro)} · Business {fmtRwf(data.prices.business)}
            </p>
          )}
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 bg-tertiary/10 border border-tertiary/20 rounded-2xl p-4">
        <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5 icon-fill">check_circle</span>
        <div>
          <p className="text-xs font-bold text-tertiary mb-0.5">Prices are fully database-driven</p>
          <p className="text-xs text-tertiary leading-relaxed">
            Changes apply immediately across the entire platform — payment processing, the public pricing page,
            and the dashboard upgrade flow all read prices live from the database. No redeployment needed.
          </p>
        </div>
      </div>
    </div>
  );
}
