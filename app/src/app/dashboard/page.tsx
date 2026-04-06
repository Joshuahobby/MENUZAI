"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useMenu } from "@/context/MenuContext";
import Link from "next/link";
import { formatEventType, formatRelativeTime } from "@/lib/utils";
import { SkeletonKpi, SkeletonRow } from "@/components/Skeleton";

interface AnalyticsData {
  kpis: { views: number; orders: number; revenue: number; avgOrderValue: number; conversionRate: number };
  topItems: { name: string; count: number }[];
  peakHours: { hour: number; count: number }[];
  recentEvents: { type: string; item: string | null; amount: number | null; time: string }[];
}

export default function DashboardPage() {
  const { restaurantId, lastSynced } = useMenu();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId === null) {
      // Still waiting for context to hydrate — keep loading
      return;
    }
    if (!restaurantId) {
      // restaurantId resolved to empty string or falsy — stop spinner
      setLoading(false);
      return;
    }

    fetch(`/api/analytics/summary?restaurantId=${restaurantId}&days=30`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [restaurantId]);

  if (loading) {
    return (
      <div className="p-6 lg:p-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonKpi key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
          <div className="bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis ?? { views: 0, orders: 0, revenue: 0, avgOrderValue: 0, conversionRate: 0 };
  const topDishes = data?.topItems?.slice(0, 3) ?? [];
  const recentEvents = data?.recentEvents?.slice(0, 5) ?? [];
  const peakHours = data?.peakHours ?? Array.from({ length: 16 }, (_, i) => ({ hour: i + 8, count: 0 }));
  const maxHourCount = Math.max(...peakHours.map((h) => h.count), 1);
  const peakHour = peakHours.reduce((best, h) => (h.count > best.count ? h : best), { hour: 0, count: 0 });

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight text-on-surface mb-1">Performance Overview</h1>
          <p className="text-secondary font-medium">Growing your restaurant with data-driven insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-surface-container-lowest px-4 py-2.5 rounded-xl border border-surface-container flex items-center gap-3 shadow-sm">
            <span className="material-symbols-outlined text-primary text-sm">calendar_month</span>
            <span className="text-sm font-semibold">Last 30 Days</span>
          </div>
          <button className="bg-primary-container hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary-container/20">
            <span className="material-symbols-outlined text-sm">download</span> Report
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Revenue", value: `$${kpis.revenue.toFixed(2)}`, color: "tertiary", icon: "payments" },
          { label: "Total Orders", value: kpis.orders.toLocaleString(), color: "tertiary", icon: "receipt_long" },
          { label: "Menu Views", value: kpis.views.toLocaleString(), color: "primary", icon: "visibility" },
          { label: "Conversion Rate", value: `${kpis.conversionRate.toFixed(1)}%`, color: "tertiary", icon: "conversion_path" },
        ].map((kpi, i) => (
          <div key={i} className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container/50">
            <p className="text-secondary text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
              <span className={`material-symbols-outlined text-${kpi.color} text-sm icon-fill`}>{kpi.icon}</span>
              {kpi.label}
            </p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-extrabold">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* AI Revenue Insight */}
        <div className="lg:col-span-8 bg-primary-container p-8 rounded-3xl shadow-xl shadow-primary-container/10 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="z-10 bg-white/20 backdrop-blur-md p-5 rounded-2xl">
              <span className={`material-symbols-outlined text-white text-4xl icon-fill`}>auto_awesome</span>
          </div>
          <div className="z-10 text-white flex-1">
            <h3 className="text-xl font-[var(--font-headline)] font-bold mb-2">AI Revenue Insight</h3>
            <p className="text-lg opacity-90 leading-snug">
              {topDishes.length > 0 ? (
                <>Your <span className="font-black underline decoration-2 underline-offset-4">{topDishes[0].name}</span> is your top performing item with {topDishes[0].count} interactions.</>
              ) : (
                <>Start getting orders to unlock AI-powered revenue insights for your menu.</>
              )}
            </p>
          </div>
          <Link href="/dashboard/analytics" className="z-10 bg-white text-primary-container px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 whitespace-nowrap">
            View Analytics
          </Link>
        </div>

        {/* Live Activity */}
        <div className="lg:col-span-4 bg-surface-container-lowest p-6 rounded-3xl border border-surface-container/50 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[var(--font-headline)] font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary-container text-xl">chat</span> Live Activity
            </h3>
            <span className="flex h-2 w-2 rounded-full bg-tertiary-container animate-pulse"></span>
          </div>
          <div className="space-y-4 flex-1">
            {recentEvents.length === 0 ? (
              <p className="text-secondary text-sm text-center py-4">No recent activity.</p>
            ) : (
              recentEvents.map((a, i) => (
                <div key={i} className="flex gap-3 items-start p-3 hover:bg-surface-container-low rounded-2xl transition-colors">
                  <div className={`w-8 h-8 rounded-full ${a.type === "order_sent" ? "bg-tertiary-container/20 text-tertiary" : "bg-primary-container/20 text-primary"} flex items-center justify-center text-[10px] font-bold`}>
                    <span className="material-symbols-outlined text-sm">
                      {a.type === "order_sent" ? "shopping_cart" : a.type === "item_view" ? "visibility" : "person"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">Someone {formatEventType(a.type)}</p>
                    <p className="text-[10px] text-secondary">{formatRelativeTime(a.time)}{a.item ? ` • ${a.item}` : ""}</p>
                  </div>
                  {a.amount && <span className="text-xs font-bold text-primary">${Number(a.amount).toFixed(2)}</span>}
                </div>
              ))
            )}
          </div>
          <Link href="/dashboard/analytics" className="mt-4 text-center text-xs font-bold text-primary hover:underline">View All Analytics</Link>
        </div>

        {/* Top Performing Dishes */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-[var(--font-headline)] font-bold">Top Performing Dishes</h3>
            <div className="flex gap-2">
              <button className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-lg">By Volume</button>
            </div>
          </div>
          <div className="space-y-6">
            {topDishes.length === 0 ? (
              <p className="text-secondary text-sm text-center py-8">No order data yet.</p>
            ) : (
              topDishes.map((dish, i) => (
                <div key={dish.name} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center shrink-0 text-secondary">
                    <span className="material-symbols-outlined text-xl">restaurant</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1.5">
                      <span className="font-bold text-sm">{dish.name}</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all" 
                        ref={(el) => {
                          if (el) {
                            el.style.width = `${Math.max(10, 85 - i * 20)}%`;
                            el.style.opacity = `${1 - i * 0.2}`;
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right pl-4">
                    <p className="font-bold text-sm">{dish.count}</p>
                    <p className="text-[10px] text-secondary">Interactions</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Peak Ordering Hours */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-[var(--font-headline)] font-bold">Peak Ordering Hours</h3>
              <p className="text-secondary text-xs">Prepare staffing for peak traffic</p>
            </div>
            {peakHour.count > 0 && (
              <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg text-[10px]">
                {peakHour.hour}:00 Peak
              </span>
            )}
          </div>
          <div className="h-48 w-full flex items-end justify-between gap-1 px-1">
            {peakHours.filter((h) => h.hour >= 8 && h.hour <= 23).map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-2 group">
                <div
                  className={`w-full rounded-t-lg transition-all min-h-[4px] ${h.count === peakHour.count && h.count > 0 ? "bg-primary-container" : "bg-surface-container-low hover:bg-primary/20"}`}
                  style={{ height: `${maxHourCount > 0 ? (h.count / maxHourCount) * 100 : 0}%` }}
                >
                  {h.count === peakHour.count && h.count > 0 && (
                    <div className="relative -top-7 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[9px] py-1 px-2 rounded font-bold shadow-sm whitespace-nowrap w-fit mx-auto">
                      Busy
                    </div>
                  )}
                </div>
                <span className={`text-[8px] font-bold ${h.count === peakHour.count && h.count > 0 ? "text-primary font-black" : "text-secondary"}`}>{h.hour}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 flex flex-col md:flex-row justify-between items-center text-secondary text-xs border-t border-surface-container pt-8 gap-4">
        <p>© 2026 MENUZA AI. {lastSynced ? `Last synced: ${formatRelativeTime(lastSynced.toISOString())}` : "Not yet synced."}</p>
        <div className="flex gap-8">
          <Link className="hover:text-primary transition-colors font-medium" href="/dashboard/analytics">Analytics</Link>
          <Link className="hover:text-primary transition-colors font-medium" href="/dashboard/settings">Settings</Link>
        </div>
      </footer>
    </div>
  );
}
