"use client";

import { useEffect, useState } from "react";
import { useMenu } from "@/context/MenuContext";
import { formatPrice, formatEventType, formatRelativeTime } from "@/lib/utils";
import { SkeletonKpi, SkeletonRow } from "@/components/Skeleton";

interface AnalyticsData {
  kpis: { views: number; orders: number; revenue: number; avgOrderValue: number; conversionRate: number };
  topItems: { name: string; count: number }[];
  peakHours: { hour: number; count: number }[];
  recentEvents: { type: string; item: string | null; amount: number | null; time: string }[];
  meta?: { days: number; plan: string };
}

const RANGE_OPTIONS = [
  { label: "Last 7 Days", days: 7, proOnly: false },
  { label: "Last 30 Days", days: 30, proOnly: false },
  { label: "Last 90 Days", days: 90, proOnly: true },
];

export default function AnalyticsPage() {
  const { restaurantId, plan, menuStyle, isLoading: menuLoading } = useMenu();
  const currency = menuStyle.currency ?? "RWF";
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(plan === "free" ? 7 : 30);
  const [rangeOpen, setRangeOpen] = useState(false);

  useEffect(() => {
    // Wait for MenuContext to finish bootstrapping before fetching;
    // otherwise a stale restaurantId can fire a request before the session cookie is set.
    if (!restaurantId || menuLoading) return;
    setTimeout(() => setLoading(true), 0);
    fetch(`/api/analytics/summary?restaurantId=${restaurantId}&days=${selectedDays}`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [restaurantId, menuLoading, selectedDays]);

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
  const topItems = data?.topItems ?? [];
  const peakHours = data?.peakHours ?? [];
  const recentEvents = data?.recentEvents ?? [];
  const maxHourCount = Math.max(...peakHours.map(h => h.count), 1);
  const peakHour = peakHours.reduce((best, h) => h.count > best.count ? h : best, { hour: 0, count: 0 });

  const isEmpty = kpis.views === 0 && kpis.orders === 0;

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">Analytics</h1>
          <p className="text-secondary font-medium">Deep dive into your restaurant&apos;s performance metrics.</p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setRangeOpen(v => !v)}
            className="bg-surface-container-lowest px-4 py-2.5 rounded-xl border border-surface-container flex items-center gap-3 shadow-sm hover:border-primary/30 transition-all"
          >
            <span className="material-symbols-outlined text-primary text-xl icon-fill">calendar_month</span>
            <span className="text-sm font-semibold">
              {RANGE_OPTIONS.find(o => o.days === selectedDays)?.label ?? `Last ${selectedDays} Days`}
            </span>
            <span className="material-symbols-outlined text-secondary text-sm">expand_more</span>
          </button>
          {rangeOpen && (
            <div className="absolute right-0 top-full mt-2 z-20 bg-surface-container-lowest border border-surface-container shadow-xl rounded-2xl overflow-hidden w-48">
              {RANGE_OPTIONS.map(opt => {
                const locked = opt.proOnly && plan === "free";
                return (
                  <button
                    key={opt.days}
                    type="button"
                    disabled={locked}
                    onClick={() => { if (!locked) { setSelectedDays(opt.days); setRangeOpen(false); } }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors ${selectedDays === opt.days ? "bg-primary/10 text-primary" : locked ? "text-secondary opacity-50 cursor-not-allowed" : "hover:bg-surface-container-low text-on-surface"}`}
                  >
                    {opt.label}
                    {locked && <span className="material-symbols-outlined text-[14px]">lock</span>}
                    {selectedDays === opt.days && !locked && <span className="material-symbols-outlined text-[14px] text-primary">check</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {plan === "free" && (
        <div className="mb-8 bg-gradient-to-br from-primary/10 to-primary-container/10 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <span className="material-symbols-outlined text-primary text-3xl icon-fill shrink-0">workspace_premium</span>
          <div className="flex-1">
            <p className="font-bold text-base">Unlock Advanced Analytics</p>
            <p className="text-secondary text-sm">You&apos;re on the Free plan — data is limited to 7 days. Upgrade to Pro for 90-day history, heatmaps, and revenue breakdowns.</p>
          </div>
          <a href="/pricing" className="shrink-0 px-5 py-2.5 bg-primary-container text-white font-bold rounded-xl text-sm hover:shadow-lg transition-all active:scale-95">
            Upgrade to Pro
          </a>
        </div>
      )}

      {isEmpty && (
        <div className="mb-8 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
          <span className="material-symbols-outlined text-primary text-4xl mb-3 block">analytics</span>
          <p className="font-bold text-lg mb-1">No data yet</p>
          <p className="text-secondary text-sm">Publish your menu and share it with customers to start seeing analytics.</p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Menu Views", value: kpis.views.toLocaleString(), icon: "visibility" },
          { label: "Total Orders", value: kpis.orders.toLocaleString(), icon: "receipt_long" },
          { label: "Revenue", value: formatPrice(kpis.revenue, currency), icon: "payments" },
          { label: "Conversion Rate", value: `${kpis.conversionRate.toFixed(1)}%`, icon: "conversion_path" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary icon-fill">{kpi.icon}</span>
              <p className="text-secondary text-xs font-bold uppercase tracking-wider">{kpi.label}</p>
            </div>
            <h3 className="text-2xl font-extrabold">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popularity Heatmap */}
        <div className="bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-[var(--font-headline)] font-bold">Popularity Heatmap</h3>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">By Interactions</span>
          </div>
          {topItems.length === 0 ? (
            <p className="text-secondary text-sm">No item data yet.</p>
          ) : (
            <div className="space-y-6">
              {(() => {
                const maxCount = Math.max(...topItems.map(i => i.count), 1);
                return topItems.map((item, i) => {
                  const heatPercent = (item.count / maxCount) * 100;
                  return (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black w-4 ${i === 0 ? "text-primary" : "text-secondary"}`}>{i + 1}</span>
                          <span className="text-sm font-bold truncate max-w-[150px] sm:max-w-none">{item.name}</span>
                          {i === 0 && (
                            <span className="bg-primary/10 text-primary text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter flex items-center gap-1">
                              <span className="material-symbols-outlined text-[10px] icon-fill">local_fire_department</span>
                              Hot
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-secondary">{item.count}</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-1000"
                          style={{ width: `${heatPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* Peak Hours */}
        <div className="bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-[var(--font-headline)] font-bold">Peak Hours</h3>
            {peakHour.count > 0 && (
              <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg text-[10px]">
                {peakHour.hour}:00 Peak
              </span>
            )}
          </div>
          <div className="h-48 w-full flex items-end justify-between gap-1 px-1">
            <style>{`
              ${peakHours.map(h => `.peak-bar-${h.hour} { height: ${maxHourCount > 0 ? (h.count / maxHourCount) * 100 : 0}%; }`).join('\n')}
            `}</style>
            {peakHours.filter(h => h.hour >= 8 && h.hour <= 23).map((h) => {
              return (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={`w-full rounded-t-lg transition-all min-h-[4px] peak-bar-${h.hour} ${h.count === peakHour.count && h.count > 0 ? "bg-primary-container" : "bg-surface-container-low"}`}
                />
                <span className={`text-[8px] font-bold ${h.count === peakHour.count && h.count > 0 ? "text-primary" : "text-secondary"}`}>
                  {h.hour}
                </span>
              </div>
            )})}
          </div>
        </div>

        {/* Live Activity */}
        <div className="bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-[var(--font-headline)] font-bold flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-tertiary-container animate-pulse"></span> Recent Activity
            </h3>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-secondary text-sm">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event, i) => (
                <div key={i} className="flex gap-3 items-center p-3 hover:bg-surface-container-low rounded-2xl transition-colors">
                  <div className="w-8 h-8 rounded-full bg-tertiary-container/20 text-tertiary flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">
                      {event.type === "order_sent" ? "shopping_cart" : event.type === "item_view" ? "visibility" : "person"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">
                      Someone {formatEventType(event.type)}
                      {event.item ? `: ${event.item}` : ""}
                    </p>
                    <p className="text-[10px] text-secondary">{formatRelativeTime(event.time)}</p>
                  </div>
                  {event.amount && <span className="text-xs font-bold text-primary">{formatPrice(Number(event.amount), currency)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
