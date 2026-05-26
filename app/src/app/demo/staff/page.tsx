"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { DemoBanner } from "@/components/DemoBanner";

type Status = "pending" | "preparing" | "ready";

interface Order {
  id: string;
  table: string;
  items: string[];
  total: number;
  status: Status;
  createdAt: Date;
  note?: string;
}

const now = () => new Date();
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000);

const SEED_ORDERS: Order[] = [
  { id: "o1", table: "4",  items: ["Truffle Ribeye x1", "House Wine x2"],           total: 54000, status: "pending",   createdAt: minsAgo(2)  },
  { id: "o2", table: "11", items: ["Mediterranean Salmon x1", "Sparkling Water x1"], total: 26000, status: "pending",   createdAt: minsAgo(7)  },
  { id: "o3", table: "2",  items: ["Menuza Royale x2", "Molten Lava Cake x1"],       total: 51000, status: "pending",   createdAt: minsAgo(14) },
  { id: "o4", table: "7",  items: ["Garden Margherita x1", "Artisan Latte x2"],      total: 27000, status: "preparing", createdAt: minsAgo(18) },
  { id: "o5", table: "3",  items: ["Superfood Bowl x2", "Summer Spritz x1"],         total: 42000, status: "preparing", createdAt: minsAgo(25) },
  { id: "o6", table: "9",  items: ["Bruschetta Trio x1", "Yuzu Cheesecake x2"],      total: 38000, status: "ready",     createdAt: minsAgo(33) },
];

const RANDOM_ORDERS = [
  { table: "5",  items: ["Classic Truffle Burger x2", "Summer Spritz x2"], total: 64000 },
  { table: "8",  items: ["Truffle Ribeye x1", "Molten Lava Cake x2"],       total: 66000 },
  { table: "12", items: ["Mediterranean Salmon x2", "Artisan Latte x1"],    total: 53500 },
  { table: "1",  items: ["Menuza Royale x1", "Yuzu Cheesecake x1"],         total: 31000 },
  { table: "6",  items: ["Superfood Bowl x1", "Matcha Crème Brûlée x2"],    total: 37000 },
];

const STATUS_COLS: { status: Status; label: string; icon: string; color: string; bg: string }[] = [
  { status: "pending",   label: "New Orders",  icon: "notifications_active", color: "text-amber-600",  bg: "bg-amber-50 border-amber-100" },
  { status: "preparing", label: "Preparing",   icon: "restaurant",           color: "text-blue-600",   bg: "bg-blue-50 border-blue-100"  },
  { status: "ready",     label: "Ready",       icon: "done_all",             color: "text-green-700",  bg: "bg-green-50 border-green-100" },
];

const NEXT: Record<Status, Status | null> = { pending: "preparing", preparing: "ready", ready: null };
const NEXT_LABEL: Record<Status, string> = { pending: "Start Preparing", preparing: "Mark Ready", ready: "Done" };
const NEXT_BTN: Record<Status, string> = {
  pending:   "bg-amber-500 hover:bg-amber-600 text-white",
  preparing: "bg-blue-600 hover:bg-blue-700 text-white",
  ready:     "bg-green-600 hover:bg-green-700 text-white",
};

const STATUS_CHIP: Record<Status, string> = {
  pending:   "bg-amber-500/10 text-amber-700",
  preparing: "bg-blue-500/10 text-blue-700",
  ready:     "bg-green-500/10 text-green-700",
};

function fmt(n: number) { return new Intl.NumberFormat().format(n); }

function elapsed(d: Date): string {
  const m = Math.floor((Date.now() - d.getTime()) / 60_000);
  return m < 1 ? "just now" : `${m}m ago`;
}

function urgencyClass(order: Order): string | null {
  if (order.status === "ready") return null;
  const m = Math.floor((Date.now() - order.createdAt.getTime()) / 60_000);
  if (m >= 15) return "border-red-300 bg-red-50/50";
  if (m >= 8)  return "border-amber-300 bg-amber-50/30";
  return null;
}

export default function StaffDemoPage() {
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [tick, setTick] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [simIdx, setSimIdx] = useState(0);
  const [newFlash, setNewFlash] = useState<string | null>(null);

  // Re-render every 30 seconds to update elapsed times
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const advance = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const next = NEXT[o.status];
      return next ? { ...o, status: next } : o;
    }));
  };

  const simulateOrder = () => {
    const template = RANDOM_ORDERS[simIdx % RANDOM_ORDERS.length];
    const newOrder: Order = {
      id: `sim-${Date.now()}`,
      table: template.table,
      items: template.items,
      total: template.total,
      status: "pending",
      createdAt: now(),
    };
    setOrders(prev => [newOrder, ...prev]);
    setSimIdx(i => i + 1);
    setNewFlash(newOrder.id);
    setTimeout(() => setNewFlash(null), 2000);
  };

  void tick; // used to trigger re-renders for elapsed time

  const byStatus = (s: Status) => orders.filter(o => o.status === s);
  const totalToday = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="min-h-screen bg-[#f0f0f0] text-on-surface">
      <DemoBanner role="staff" restaurantName="Le Bistro Demo" />

      {/* Header */}
      <header className="bg-white border-b border-black/6 px-6 py-4 sticky top-10 z-40">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-secondary font-medium">Staff Orders Panel</p>
              <h1 className="text-lg font-[var(--font-headline)] font-extrabold tracking-tight">Le Bistro Demo</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-xs text-secondary">
              <span className="bg-[#faf8f6] border border-black/6 px-3 py-1.5 rounded-lg font-semibold">
                {totalToday} orders today
              </span>
              <span className="bg-[#faf8f6] border border-black/6 px-3 py-1.5 rounded-lg font-semibold">
                {fmt(totalRevenue)} RWF
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundOn(s => !s)}
              title={soundOn ? "Sound on" : "Sound off"}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                soundOn ? "border-primary/30 text-primary bg-primary/5" : "border-black/10 text-secondary bg-white"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{soundOn ? "volume_up" : "volume_off"}</span>
              <span className="hidden sm:inline">{soundOn ? "Sound On" : "Sound Off"}</span>
            </button>

            <button
              onClick={simulateOrder}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg bg-on-surface text-white hover:opacity-90 transition-opacity cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              Simulate Order
            </button>

            <Link href="/demo/owner"
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-black/10 text-secondary hover:bg-black/3 transition-colors">
              <span className="material-symbols-outlined text-[14px]">dashboard</span>
              Owner View
            </Link>
          </div>
        </div>
      </header>

      {/* Columns */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STATUS_COLS.map(col => {
            const colOrders = byStatus(col.status);
            return (
              <div key={col.status} className={`rounded-2xl border p-4 ${col.bg}`}>
                {/* Column header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[18px] ${col.color}`}>{col.icon}</span>
                    <span className={`text-sm font-bold ${col.color}`}>{col.label}</span>
                  </div>
                  {colOrders.length > 0 && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${STATUS_CHIP[col.status]}`}>
                      {colOrders.length}
                    </span>
                  )}
                </div>

                {/* Order cards */}
                <div className="space-y-3">
                  {colOrders.length === 0 && (
                    <div className="text-center py-8 text-secondary/50 text-xs">No orders</div>
                  )}
                  {colOrders.map(order => {
                    const urgent = urgencyClass(order);
                    const isNew = newFlash === order.id;
                    return (
                      <div key={order.id}
                        className={`bg-white rounded-xl p-4 border transition-all ${urgent ?? "border-black/6"} ${isNew ? "ring-2 ring-amber-400 scale-[1.01]" : ""}`}
                      >
                        {/* Card header */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
                            <span className="material-symbols-outlined text-[11px]">table_restaurant</span>
                            Table {order.table}
                          </span>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const m = Math.floor((Date.now() - order.createdAt.getTime()) / 60_000);
                              if (order.status !== "ready" && m >= 15) return (
                                <span className="text-[9px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">{m}m ⚠️</span>
                              );
                              if (order.status !== "ready" && m >= 8) return (
                                <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">{m}m</span>
                              );
                              return null;
                            })()}
                            <span className="text-[10px] text-secondary">{elapsed(order.createdAt)}</span>
                          </div>
                        </div>

                        {/* Items */}
                        <ul className="space-y-1 mb-4">
                          {order.items.map((item, j) => (
                            <li key={j} className="text-xs text-on-surface/80 flex items-start gap-1.5">
                              <span className="text-primary mt-0.5">·</span>
                              {item}
                            </li>
                          ))}
                        </ul>

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{fmt(order.total)} RWF</span>
                          {NEXT[order.status] ? (
                            <button
                              onClick={() => advance(order.id)}
                              className={`text-[11px] font-bold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${NEXT_BTN[order.status]}`}
                            >
                              {NEXT_LABEL[order.status]}
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">
                              Served ✓
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-secondary/50 mt-6">
          Click <strong>Simulate Order</strong> to add a new incoming order · Move cards through the pipeline with the action buttons
        </p>

        {/* CTA */}
        <div className="mt-10 bg-on-surface rounded-2xl p-8 text-center">
          <h2 className="text-xl font-[var(--font-headline)] font-black text-white mb-3">
            Set up real-time orders for your restaurant
          </h2>
          <p className="text-white/40 text-sm mb-6">Your staff panel live in under 5 minutes.</p>
          <Link href="/login"
            className="inline-block px-7 py-3 bg-primary text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/30">
            Create Free Account
          </Link>
        </div>
      </main>
    </div>
  );
}
