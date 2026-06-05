"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatRelativeTime, formatPrice } from "@/lib/utils";

const PLAN_STYLES: Record<string, { label: string; className: string }> = {
  free:     { label: "Free",     className: "bg-surface-container text-secondary" },
  trial:    { label: "Trial",    className: "bg-violet-500/10 text-violet-600" },
  pro:      { label: "Pro",      className: "bg-green-500/10 text-green-700" },
  business: { label: "Business", className: "bg-amber-500/10 text-amber-700" },
};

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending:         "bg-amber-500/10 text-amber-700",
  pending_payment: "bg-blue-500/10 text-blue-600",
  preparing:       "bg-primary/10 text-primary",
  confirmed:       "bg-green-500/10 text-green-700",
  cancelled:       "bg-red-500/10 text-red-600",
};

const TX_STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-500/10 text-green-700",
  pending:   "bg-amber-500/10 text-amber-700",
  failed:    "bg-red-500/10 text-red-600",
  expired:   "bg-surface-container text-secondary",
};

type Tab = "overview" | "menus" | "orders" | "transactions";

interface RestaurantDetail {
  id: string; name: string; slug: string | null; plan: string; resolvedPlan: string;
  trial_ends_at: string | null; plan_expires_at: string | null;
  created_at: string; onboarded: boolean; custom_domain: string | null;
  category: string | null; ownerEmail: string | null;
}
interface MenuEntry { id: string; name: string; slug: string | null; status: string; createdAt: string; updatedAt: string; itemCount: number; }
interface OrderEntry { id: string; items: { name: string; quantity: number }[]; total: number; status: string; source: string; customer_name: string | null; table_number: string | null; created_at: string; }
interface TxEntry { id: string; depositId: string; amount: number; currency: string; plan: string; status: string; createdAt: string; }
interface Analytics { views: number; orders: number; revenue: number; conversionRate: number; }

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [menus, setMenus] = useState<MenuEntry[]>([]);
  const [orders, setOrders] = useState<OrderEntry[]>([]);
  const [transactions, setTransactions] = useState<TxEntry[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({ views: 0, orders: 0, revenue: 0, conversionRate: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/admin/restaurants/${id}`)
      .then(r => r.json())
      .then(d => {
        setRestaurant(d.restaurant ?? null);
        setMenus(d.menus ?? []);
        setOrders(d.recentOrders ?? []);
        setTransactions(d.transactions ?? []);
        setAnalytics(d.analytics ?? { views: 0, orders: 0, revenue: 0, conversionRate: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-[48px] text-secondary animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="p-10 text-center text-secondary">
        <p>Restaurant not found.</p>
        <Link href="/admin/restaurants" className="text-primary font-bold mt-4 inline-block">← Back</Link>
      </div>
    );
  }

  const planStyle = PLAN_STYLES[restaurant.resolvedPlan] ?? PLAN_STYLES.free;

  const stat = (label: string, value: string | number) => (
    <div className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-container/50">
      <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-extrabold font-[var(--font-headline)] text-on-surface">{value}</p>
    </div>
  );

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview",     label: "Overview",     icon: "dashboard"      },
    { key: "menus",        label: "Menus",        icon: "menu_book"      },
    { key: "orders",       label: "Orders",       icon: "receipt_long"   },
    { key: "transactions", label: "Transactions", icon: "payments"       },
  ];

  return (
    <div className="p-6 lg:p-10 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/restaurants" className="flex items-center gap-1 text-secondary hover:text-primary text-sm font-semibold mb-4 w-fit transition-colors">
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          Restaurants
        </Link>
        <div className="flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-[var(--font-headline)] font-extrabold tracking-tight flex items-center gap-3 flex-wrap">
              {restaurant.name}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${planStyle.className}`}>
                {planStyle.label}
              </span>
            </h1>
            {restaurant.ownerEmail && <p className="text-sm text-secondary mt-1">{restaurant.ownerEmail}</p>}
            {restaurant.slug && <p className="text-[11px] text-secondary font-mono mt-0.5">/menu/{restaurant.slug}</p>}
          </div>
          <div className="text-xs text-secondary text-right">
            <p>Joined {formatRelativeTime(restaurant.created_at)}</p>
            {restaurant.plan_expires_at && restaurant.plan !== "free" && (
              <p className="text-amber-600 mt-0.5">Expires {formatRelativeTime(restaurant.plan_expires_at)}</p>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stat("Orders (30d)", analytics.orders.toLocaleString())}
        {stat("Revenue (30d)", `${analytics.revenue.toLocaleString()} RWF`)}
        {stat("Views (30d)", analytics.views.toLocaleString())}
        {stat("Conversion", `${analytics.conversionRate.toFixed(1)}%`)}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              tab === t.key ? "bg-surface shadow-sm text-primary" : "text-secondary hover:text-on-surface"
            }`}
          >
            <span className={`material-symbols-outlined text-[15px] ${tab === t.key ? "icon-fill" : ""}`}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-6">
          {orders.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Recent Orders</h2>
              <div className="space-y-2">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-4 border border-surface-container/50">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${ORDER_STATUS_STYLES[o.status] ?? ""}`}>{o.status.replace("_", " ")}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{(o.items ?? []).map(i => `${i.name}×${i.quantity}`).join(", ") || "—"}</p>
                      <p className="text-[11px] text-secondary">{formatRelativeTime(o.created_at)}{o.table_number ? ` · Table ${o.table_number}` : ""}</p>
                    </div>
                    <span className="font-mono text-sm font-bold text-on-surface whitespace-nowrap">{o.total?.toLocaleString()} RWF</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {transactions.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Recent Payments</h2>
              <div className="space-y-2">
                {transactions.slice(0, 3).map(tx => (
                  <div key={tx.id} className="bg-surface-container-lowest rounded-2xl p-4 flex items-center gap-4 border border-surface-container/50">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${TX_STATUS_STYLES[tx.status] ?? ""}`}>{tx.status}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold capitalize">{tx.plan}</p>
                      <p className="text-[11px] text-secondary">{formatRelativeTime(tx.createdAt)}</p>
                    </div>
                    <span className="font-mono text-sm font-bold">{tx.amount.toLocaleString()} {tx.currency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Menus Tab */}
      {tab === "menus" && (
        <div className="space-y-3">
          {menus.length === 0 ? (
            <p className="text-secondary text-sm text-center py-12">No menus yet.</p>
          ) : menus.map(m => (
            <div key={m.id} className="bg-surface-container-lowest rounded-2xl p-5 flex items-center gap-4 border border-surface-container/50">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.status === "published" ? "bg-green-500/10 text-green-700" : "bg-surface-container text-secondary"}`}>
                {m.status}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{m.name}</p>
                {m.slug && <p className="text-[10px] text-secondary font-mono">/menu/{m.slug}</p>}
              </div>
              <div className="text-right text-xs text-secondary">
                <p>{m.itemCount} items</p>
                <p>Updated {formatRelativeTime(m.updatedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orders Tab */}
      {tab === "orders" && (
        <div className="bg-surface-container-lowest border border-surface-container rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-container text-[10px] font-bold uppercase tracking-widest text-secondary">
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/60">
                {orders.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-12 text-center text-secondary text-sm">No orders yet.</td></tr>
                ) : orders.map(o => (
                  <tr key={o.id} className="hover:bg-surface-container/40">
                    <td className="px-5 py-4 text-secondary text-xs whitespace-nowrap">{formatRelativeTime(o.created_at)}</td>
                    <td className="px-4 py-4 text-xs text-secondary">{o.customer_name ?? "Guest"}{o.table_number ? ` · T${o.table_number}` : ""}</td>
                    <td className="px-4 py-4 text-xs text-secondary truncate max-w-[200px]">{(o.items ?? []).map(i => `${i.name}×${i.quantity}`).join(", ") || "—"}</td>
                    <td className="px-4 py-4 text-right font-mono text-sm font-bold whitespace-nowrap">{o.total?.toLocaleString()} RWF</td>
                    <td className="px-4 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${ORDER_STATUS_STYLES[o.status] ?? ""}`}>{o.status.replace("_", " ")}</span></td>
                    <td className="px-4 py-4 text-[10px] text-secondary capitalize">{o.source ?? "whatsapp"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {tab === "transactions" && (
        <div className="bg-surface-container-lowest border border-surface-container rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-container text-[10px] font-bold uppercase tracking-widest text-secondary">
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Deposit ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/60">
                {transactions.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-secondary text-sm">No transactions yet.</td></tr>
                ) : transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-surface-container/40">
                    <td className="px-5 py-4 text-secondary text-xs whitespace-nowrap">{formatRelativeTime(tx.createdAt)}</td>
                    <td className="px-4 py-4 text-xs font-mono text-secondary capitalize">{tx.plan}</td>
                    <td className="px-4 py-4 text-right font-mono text-sm font-bold whitespace-nowrap">{tx.amount.toLocaleString()} {tx.currency}</td>
                    <td className="px-4 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${TX_STATUS_STYLES[tx.status] ?? ""}`}>{tx.status}</span></td>
                    <td className="px-4 py-4 text-[10px] font-mono text-secondary truncate max-w-[180px]" title={tx.depositId}>{tx.depositId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
