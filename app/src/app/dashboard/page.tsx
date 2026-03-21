"use client";
import Image from "next/image";
import { analyticsData, menuItems } from "@/data/mockData";

export default function DashboardPage() {
  const { kpis, liveActivity } = analyticsData;
  const topDishes = menuItems.filter((i) => i.orders).sort((a, b) => (b.orders || 0) - (a.orders || 0)).slice(0, 3);

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
          { label: "Total Revenue", ...kpis.revenue, color: "tertiary" },
          { label: "Total Orders", ...kpis.orders, color: "tertiary" },
          { label: "Avg. Order Value", ...kpis.avgValue, color: "primary" },
          { label: "Conversion Rate", ...kpis.conversion, color: "tertiary" },
        ].map((kpi, i) => (
          <div key={i} className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container/50">
            <p className="text-secondary text-xs font-bold uppercase tracking-wider mb-2">{kpi.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-extrabold">{kpi.value}</h3>
              <span className={`text-${kpi.color} text-xs font-bold flex items-center gap-0.5 bg-${kpi.color}/10 px-2 py-1 rounded-full`}>
                {kpi.change}
              </span>
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
              Your <span className="font-black underline decoration-2 underline-offset-4">Classic Burger</span> is a top seller.
              Creating a combo with Soda could increase average ticket size by{" "}
              <span className="bg-white/20 px-2 py-0.5 rounded-lg font-bold">15%</span>.
            </p>
          </div>
          <button className="z-10 bg-white text-primary-container px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 whitespace-nowrap">
            Launch Promo
          </button>
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
            {liveActivity.map((a, i) => (
              <div key={i} className="flex gap-3 items-start p-3 hover:bg-surface-container-low rounded-2xl transition-colors">
                <div className={`w-8 h-8 rounded-full ${i % 2 === 0 ? "bg-tertiary-container/20 text-tertiary" : "bg-primary-container/20 text-primary"} flex items-center justify-center text-[10px] font-bold`}>
                  {a.initials}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{a.name} {a.action}</p>
                  <p className="text-[10px] text-secondary">{a.time}{a.source ? ` via ${a.source}` : ""}</p>
                </div>
                {a.amount && <span className="text-xs font-bold text-primary">{a.amount}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Dishes */}
        <div className="lg:col-span-7 bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-[var(--font-headline)] font-bold">Top Performing Dishes</h3>
            <div className="flex gap-2">
              <button className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-lg">By Margin</button>
              <button className="text-xs font-bold px-3 py-1 hover:bg-surface-container-low rounded-lg transition-colors">By Volume</button>
            </div>
          </div>
          <div className="space-y-6">
            {topDishes.map((dish, i) => (
              <div key={dish.id} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-container overflow-hidden shrink-0 relative">
                   <Image alt={dish.name} className="object-cover" src={dish.image} fill sizes="48px" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1.5">
                    <span className="font-bold text-sm">{dish.name}</span>
                    <span className="text-xs font-bold text-tertiary">{dish.margin}% Margin</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all" 
                      ref={(el) => {
                        if (el) {
                          el.style.width = `${85 - i * 20}%`;
                          el.style.opacity = `${1 - i * 0.2}`;
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="text-right pl-4">
                  <p className="font-bold text-sm">{dish.orders}</p>
                  <p className="text-[10px] text-secondary">Orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Ordering Hours */}
        <div className="lg:col-span-5 bg-surface-container-lowest p-8 rounded-3xl border border-surface-container/50 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-[var(--font-headline)] font-bold">Peak Ordering Hours</h3>
              <p className="text-secondary text-xs">Prepare staffing for peak traffic</p>
            </div>
            <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg text-[10px]">7PM Peak</span>
          </div>
          <div className="h-48 w-full flex items-end justify-between gap-3 px-2">
            {analyticsData.peakHours.map((h) => (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-3 group">
                <div
                  className={`w-full rounded-t-lg transition-all ${h.value >= 90 ? "bg-primary-container" : "bg-surface-container-low hover:bg-primary/20"}`}
                  ref={(el) => {
                    if (el) {
                      el.style.height = `${h.value}%`;
                    }
                  }}
                >
                  {h.value >= 90 && (
                    <div className="relative -top-7 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[9px] py-1 px-2 rounded font-bold shadow-sm whitespace-nowrap w-fit mx-auto">
                      Busy
                    </div>
                  )}
                </div>
                <span className={`text-[9px] font-bold ${h.value >= 90 ? "text-primary font-black" : "text-secondary"}`}>{h.hour}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 flex flex-col md:flex-row justify-between items-center text-secondary text-xs border-t border-surface-container pt-8 gap-4">
        <p>© 2026 MENUZA AI. Last synced: Just now.</p>
        <div className="flex gap-8">
          <a className="hover:text-primary transition-colors font-medium" href="#">Business Intelligence Support</a>
          <a className="hover:text-primary transition-colors font-medium" href="#">Export Data Settings</a>
        </div>
      </footer>
    </div>
  );
}
