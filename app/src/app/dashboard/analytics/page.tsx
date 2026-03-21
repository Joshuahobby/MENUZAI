"use client";
import Image from "next/image";
import { analyticsData, menuItems } from "@/data/mockData";

export default function AnalyticsPage() {
  const { kpis, peakHours, liveActivity } = analyticsData;
  const topDishes = menuItems.filter((i) => i.orders).sort((a, b) => (b.orders || 0) - (a.orders || 0)).slice(0, 5);

  return (
    <div className="p-6 lg:p-12 pb-24 lg:pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">Analytics</h1>
          <p className="text-secondary font-medium">Deep dive into your restaurant&apos;s performance metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-surface-container-lowest px-4 py-2.5 rounded-xl border border-surface-container flex items-center gap-3 shadow-sm">
            <span className="material-symbols-outlined text-primary text-3xl icon-fill">bolt</span>
            <span className="text-sm font-semibold">Last 30 Days</span>
          </div>
          <button className="bg-primary-container hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary-container/20">
            <span className="material-symbols-outlined text-sm">download</span> Export
          </button>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", ...kpis.revenue, icon: "payments" },
          { label: "Total Orders", ...kpis.orders, icon: "receipt_long" },
          { label: "Avg. Order Value", ...kpis.avgValue, icon: "trending_up" },
          { label: "Conversion Rate", ...kpis.conversion, icon: "conversion_path" },
        ].map((kpi, i) => (
          <div key={i} className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary icon-fill">{kpi.icon}</span>
              <p className="text-secondary text-xs font-bold uppercase tracking-wider">{kpi.label}</p>
            </div>
            <h3 className="text-2xl font-extrabold mb-1">{kpi.value}</h3>
            <span className="text-tertiary text-xs font-bold bg-tertiary/10 px-2 py-0.5 rounded-full">{kpi.change}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Dishes */}
        <div className="bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50 shadow-sm">
          <h3 className="text-xl font-[var(--font-headline)] font-bold mb-6">Top Performing Dishes</h3>
          <div className="space-y-5">
            {topDishes.map((dish, i) => (
              <div key={dish.id} className="flex items-center gap-4">
                <span className="text-xs font-bold text-secondary w-5">{i + 1}</span>
                <div className="w-10 h-10 rounded-xl bg-surface-container overflow-hidden shrink-0 relative">
                  <Image alt={dish.name} className="object-cover" src={dish.image} fill sizes="40px" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{dish.name}</p>
                  <p className="text-[10px] text-secondary">${dish.price.toFixed(2)} · {dish.margin}% margin</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-primary">{dish.orders}</p>
                  <p className="text-[10px] text-secondary">orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-[var(--font-headline)] font-bold">Peak Ordering Hours</h3>
            <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg text-[10px]">7PM Peak</span>
          </div>
          <div className="h-48 w-full flex items-end justify-between gap-3 px-2">
            {peakHours.map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-3">
                <div 
                  className={`w-full rounded-t-lg transition-all ${h.value >= 90 ? "bg-primary-container" : "bg-surface-container-low hover:bg-primary/20"}`}
                  ref={(el) => {
                    if (el) {
                      el.style.height = `${h.value}%`;
                    }
                  }}
                />
                <span className={`text-[9px] font-bold ${h.value >= 90 ? "text-primary font-black" : "text-secondary"}`}>{h.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50 shadow-sm">
          <h3 className="text-xl font-[var(--font-headline)] font-bold mb-6">Category Performance</h3>
          <div className="space-y-4">
            {[
              { name: "Main Courses", revenue: "$12,400", percent: 50 },
              { name: "Specials", revenue: "$6,200", percent: 25 },
              { name: "Desserts", revenue: "$3,800", percent: 15 },
              { name: "Beverages", revenue: "$2,450", percent: 10 },
            ].map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold">{cat.name}</span>
                  <span className="text-secondary">{cat.revenue}</span>
                </div>
                <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full" 
                    ref={(el) => {
                      if (el) {
                        el.style.width = `${cat.percent}%`;
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity */}
        <div className="bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-[var(--font-headline)] font-bold flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-tertiary-container animate-pulse"></span> Live Activity
            </h3>
          </div>
          <div className="space-y-4">
            {liveActivity.map((a, i) => (
              <div key={i} className="flex gap-3 items-center p-3 hover:bg-surface-container-low rounded-2xl transition-colors">
                <div className="w-8 h-8 rounded-full bg-tertiary-container/20 text-tertiary flex items-center justify-center text-[10px] font-bold">{a.initials}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{a.name} {a.action}</p>
                  <p className="text-[10px] text-secondary">{a.time}</p>
                </div>
                {a.amount && <span className="text-xs font-bold text-primary">{a.amount}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
