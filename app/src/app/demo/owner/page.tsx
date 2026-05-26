"use client";

import Link from "next/link";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DemoBanner } from "@/components/DemoBanner";

const RESTAURANT = "Le Bistro Demo";

const STATS = [
  { label: "Menu Views",   value: "847",     delta: "+12%", icon: "visibility",   color: "text-primary"  },
  { label: "Orders Today", value: "23",       delta: "+4",   icon: "receipt_long", color: "text-tertiary" },
  { label: "Revenue",      value: "45,200",   delta: "+8%",  icon: "payments",     color: "text-primary"  },
  { label: "Conversion",   value: "31%",      delta: "+3pp", icon: "trending_up",  color: "text-tertiary" },
];

const CHART_DATA = [
  { day: "Mon", views: 120, revenue: 38000 },
  { day: "Tue", views: 145, revenue: 44000 },
  { day: "Wed", views: 98,  revenue: 29000 },
  { day: "Thu", views: 178, revenue: 55000 },
  { day: "Fri", views: 203, revenue: 67000 },
  { day: "Sat", views: 165, revenue: 52000 },
  { day: "Sun", views: 138, revenue: 45200 },
];

const QUICK_ACTIONS = [
  { icon: "edit",           label: "Edit Menu",       href: "/demo/owner",  desc: "Add, remove, reorder items" },
  { icon: "qr_code_2",      label: "QR Poster",       href: "/demo/owner",  desc: "Download table badge PDF" },
  { icon: "open_in_new",    label: "View Public Menu", href: "/menu/demo",   desc: "See what guests see" },
  { icon: "star_rate",      label: "Reviews",         href: "/demo/owner",  desc: "4.8 ★ from 38 reviews" },
];

type OrderStatus = "pending" | "preparing" | "ready";

interface DemoOrder {
  id: string;
  table: string;
  items: string[];
  total: number;
  status: OrderStatus;
  minsAgo: number;
}

const INITIAL_ORDERS: DemoOrder[] = [
  { id: "d1", table: "4",  items: ["Truffle Ribeye x1", "House Wine x2"],     total: 54000, status: "pending",   minsAgo: 3  },
  { id: "d2", table: "7",  items: ["Mediterranean Salmon x1", "Sparkling x1"],total: 26000, status: "preparing", minsAgo: 12 },
  { id: "d3", table: "2",  items: ["Menuza Royale x2", "Lava Cake x1"],       total: 51000, status: "ready",     minsAgo: 22 },
];

const MENU_PREVIEW = [
  { name: "Truffle Ribeye Steak",   price: "38,000", badge: "Chef's Pick", available: true,  img: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=120&h=80&fit=crop" },
  { name: "Mediterranean Salmon",   price: "24,000", badge: "Healthy",     available: true,  img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=120&h=80&fit=crop" },
  { name: "Molten Lava Cake",       price: "14,000", badge: "Bestseller",  available: false, img: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=120&h=80&fit=crop" },
];

const STATUS_NEXT: Record<OrderStatus, OrderStatus | null> = {
  pending:   "preparing",
  preparing: "ready",
  ready:     null,
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:   "Mark Preparing",
  preparing: "Mark Ready",
  ready:     "Done",
};
const STATUS_COLOR: Record<OrderStatus, string> = {
  pending:   "bg-amber-500/10 text-amber-700",
  preparing: "bg-blue-500/10 text-blue-700",
  ready:     "bg-green-500/10 text-green-700",
};

export default function OwnerDemoPage() {
  const [orders, setOrders] = useState<DemoOrder[]>(INITIAL_ORDERS);
  const [menuItems, setMenuItems] = useState(MENU_PREVIEW);
  const [activeTab, setActiveTab] = useState<"views" | "revenue">("views");

  const advanceOrder = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const next = STATUS_NEXT[o.status];
      return next ? { ...o, status: next } : o;
    }));
  };

  const toggleAvailable = (idx: number) => {
    setMenuItems(prev => prev.map((m, i) => i === idx ? { ...m, available: !m.available } : m));
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-on-surface">
      <DemoBanner role="owner" restaurantName={RESTAURANT} />

      {/* Dashboard header */}
      <header className="bg-white border-b border-black/6 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-secondary/50 mb-0.5">Owner Dashboard</p>
            <h1 className="text-2xl font-[var(--font-headline)] font-extrabold tracking-tight">{RESTAURANT}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/menu/demo" target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-secondary border border-black/10 px-3.5 py-2 rounded-lg hover:bg-black/3 transition-colors">
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              Public Menu
            </Link>
            <Link href="/login"
              className="text-xs font-bold text-white bg-primary px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-black/5">
              <div className="flex items-center justify-between mb-4">
                <span className={`material-symbols-outlined text-[20px] ${s.color}`}>{s.icon}</span>
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{s.delta}</span>
              </div>
              <p className="text-2xl font-black tracking-tight mb-0.5">{s.value}</p>
              <p className="text-xs text-secondary font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-black/5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-base">7-day trend</h2>
              <div className="flex gap-1 bg-[#faf8f6] p-1 rounded-lg">
                {(["views", "revenue"] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all capitalize cursor-pointer ${activeTab === t ? "bg-white shadow-sm text-on-surface" : "text-secondary hover:text-on-surface"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={CHART_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a04100" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#a04100" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false}
                  tickFormatter={v => activeTab === "revenue" ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip
                  contentStyle={{ border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12, fontSize: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
                  formatter={(v: unknown) => {
                    const n = Number(v);
                    return activeTab === "revenue" ? [`${new Intl.NumberFormat().format(n)} RWF`, "Revenue"] : [n, "Views"];
                  }}
                />
                <Area type="monotone" dataKey={activeTab} stroke="#a04100" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 border border-black/5">
            <h2 className="font-bold text-base mb-5">Quick actions</h2>
            <div className="space-y-2">
              {QUICK_ACTIONS.map((a, i) => (
                <Link key={i} href={a.href}
                  className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-[#faf8f6] transition-colors group">
                  <div className="w-9 h-9 bg-primary/8 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/12 transition-colors">
                    <span className="material-symbols-outlined text-primary text-[18px]">{a.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-on-surface">{a.label}</p>
                    <p className="text-[11px] text-secondary truncate">{a.desc}</p>
                  </div>
                  <span className="material-symbols-outlined text-secondary text-[16px] ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl p-6 border border-black/5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base">Recent orders</h2>
              <Link href="/demo/staff" className="text-xs font-semibold text-primary hover:underline">
                Open staff panel →
              </Link>
            </div>
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center gap-4 p-4 bg-[#faf8f6] rounded-xl border border-black/4">
                  <div className="shrink-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
                      <span className="material-symbols-outlined text-[11px]">table_restaurant</span>
                      T{o.table}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-secondary truncate">{o.items.slice(0, 2).join(" · ")}</p>
                    <p className="text-xs font-bold mt-0.5">{new Intl.NumberFormat().format(o.total)} RWF · {o.minsAgo}m ago</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status]}`}>
                      {o.status}
                    </span>
                    {STATUS_NEXT[o.status] && (
                      <button onClick={() => advanceOrder(o.id)}
                        className="text-[10px] font-bold text-primary hover:underline cursor-pointer">
                        {STATUS_LABEL[o.status]}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Menu items */}
          <div className="bg-white rounded-2xl p-6 border border-black/5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base">Menu items</h2>
              <Link href="/menu/demo" className="text-xs font-semibold text-primary hover:underline">
                View full menu →
              </Link>
            </div>
            <div className="space-y-3">
              {menuItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3.5 bg-[#faf8f6] rounded-xl border border-black/4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.img} alt={item.name} className="w-14 h-10 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-secondary">{item.price} RWF · <span className="text-primary/70">{item.badge}</span></p>
                  </div>
                  <button onClick={() => toggleAvailable(idx)}
                    className={`shrink-0 w-11 h-6 rounded-full transition-colors cursor-pointer relative ${item.available ? "bg-green-500" : "bg-black/15"}`}
                    title={item.available ? "Available — click to mark sold out" : "Sold out — click to restore"}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${item.available ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
              <p className="text-[11px] text-secondary/60 text-center pt-1">Toggle the switches to mark items sold out</p>
            </div>
          </div>

        </div>

        {/* Sign up CTA */}
        <div className="bg-on-surface rounded-3xl p-10 text-center">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3">Ready to start?</p>
          <h2 className="text-2xl font-[var(--font-headline)] font-black text-white mb-4">Get your real dashboard in 2 minutes</h2>
          <p className="text-white/40 text-sm mb-7">Free plan — upload your menu, get your QR code, go live today.</p>
          <Link href="/login"
            className="inline-block px-8 py-3.5 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/30">
            Create Free Account
          </Link>
        </div>

      </main>
    </div>
  );
}
