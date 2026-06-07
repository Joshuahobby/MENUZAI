"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatRelativeTime, formatPrice } from "@/lib/utils";

const PLAN_STYLES: Record<string, { label: string; className: string }> = {
  free:     { label: "Free",     className: "bg-surface-container text-secondary" },
  trial:    { label: "Trial",    className: "bg-violet-500/10 text-violet-600" },
  pro:      { label: "Pro",      className: "bg-emerald-500/10 text-emerald-700" },
  business: { label: "Business", className: "bg-amber-500/10 text-amber-700" },
};

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending:         "bg-amber-500/10 text-amber-700",
  pending_payment: "bg-blue-500/10 text-blue-600",
  preparing:       "bg-primary/10 text-primary",
  confirmed:       "bg-emerald-500/10 text-emerald-700",
  cancelled:       "bg-red-500/10 text-red-600",
};

const TX_STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-700",
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

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "overview",     label: "Overview",     icon: "dashboard"    },
  { key: "menus",        label: "Menus",        icon: "menu_book"    },
  { key: "orders",       label: "Orders",       icon: "receipt_long" },
  { key: "transactions", label: "Transactions", icon: "payments"     },
];

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-black/6 rounded-2xl p-5 shadow-sm">
      <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-extrabold font-[var(--font-headline)] text-on-surface">{value}</p>
    </div>
  );
}

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
      <div className="p-8 text-center text-secondary">
        <p className="mb-4">Restaurant not found.</p>
        <Link href="/admin/restaurants" className="text-primary font-bold text-sm hover:underline">
          ← Back to Restaurants
        </Link>
      </div>
    );
  }

  const planStyle = PLAN_STYLES[restaurant.resolvedPlan] ?? PLAN_STYLES.free;

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-secondary mb-6">
        <Link href="/admin/restaurants" className="hover:text-primary transition-colors font-medium">
          Restaurants
        </Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-on-surface font-semibold">{restaurant.name}</span>
      </div>

      {/* Restaurant header */}
      <div className="bg-white border border-black/6 rounded-2xl p-5 shadow-sm mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-on-surface tracking-tight">{restaurant.name}</h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${planStyle.className}`}>
                {planStyle.label}
              </span>
              {!restaurant.onboarded && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600">
                  Not onboarded
                </span>
              )}
            </div>
            {restaurant.ownerEmail && (
              <p className="text-sm text-secondary mt-1">{restaurant.ownerEmail}</p>
            )}
            {restaurant.slug && (
              <p className="text-[11px] text-secondary font-mono mt-0.5">/menu/{restaurant.slug}</p>
            )}
          </div>
          <div className="text-xs text-secondary text-right shrink-0">
            <p>Joined {formatRelativeTime(restaurant.created_at)}</p>
            {restaurant.plan_expires_at && restaurant.plan !== "free" && (
              <p className="text-amber-600 mt-0.5 font-medium">
                Expires {formatRelativeTime(restaurant.plan_expires_at)}
              </p>
            )}
            {restaurant.trial_ends_at && restaurant.resolvedPlan === "trial" && (
              <p className="text-violet-600 mt-0.5 font-medium">
                Trial ends {formatRelativeTime(restaurant.trial_ends_at)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Orders (30d)"  value={analytics.orders.toLocaleString()} />
        <KpiCard label="Revenue (30d)" value={formatPrice(analytics.revenue, "RWF")} />
        <KpiCard label="Views (30d)"   value={analytics.views.toLocaleString()} />
        <KpiCard label="Conversion"    value={`${analytics.conversionRate.toFixed(1)}%`} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-black/6 rounded-xl p-1 mb-6 shadow-sm overflow-x-auto">
        {TABS.map(t => (
          <button
            type="button"
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              tab === t.key
                ? "bg-primary/10 text-primary"
                : "text-secondary hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className={`material-symbols-outlined text-[15px] ${tab === t.key ? "icon-fill" : ""}`}>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-5">
          {orders.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Recent Orders</p>
              <div className="space-y-2">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="bg-white border border-black/6 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize whitespace-nowrap ${ORDER_STATUS_STYLES[o.status] ?? ""}`}>
                      {o.status.replace("_", " ")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {(o.items ?? []).map(i => `${i.name} ×${i.quantity}`).join(", ") || "—"}
                      </p>
                      <p className="text-[11px] text-secondary">
                        {formatRelativeTime(o.created_at)}{o.table_number ? ` · Table ${o.table_number}` : ""}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-bold text-on-surface whitespace-nowrap">
                      {o.total?.toLocaleString()} RWF
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {transactions.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-3">Recent Payments</p>
              <div className="space-y-2">
                {transactions.slice(0, 3).map(tx => (
                  <div key={tx.id} className="bg-white border border-black/6 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize whitespace-nowrap ${TX_STATUS_STYLES[tx.status] ?? ""}`}>
                      {tx.status}
                    </span>
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

          {orders.length === 0 && transactions.length === 0 && (
            <p className="text-center text-secondary text-sm py-12">No activity yet.</p>
          )}
        </div>
      )}

      {/* Menus Tab */}
      {tab === "menus" && (
        <div className="space-y-2">
          {menus.length === 0 ? (
            <p className="text-secondary text-sm text-center py-16">No menus yet.</p>
          ) : menus.map(m => (
            <div key={m.id} className="bg-white border border-black/6 rounded-xl p-4 flex items-center gap-4 shadow-sm">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                m.status === "published" ? "bg-emerald-500/10 text-emerald-700" : "bg-surface-container text-secondary"
              }`}>
                {m.status}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{m.name}</p>
                {m.slug && <p className="text-[10px] text-secondary font-mono">/menu/{m.slug}</p>}
              </div>
              <div className="text-right text-xs text-secondary shrink-0">
                <p>{m.itemCount} items</p>
                <p>Updated {formatRelativeTime(m.updatedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orders Tab */}
      {tab === "orders" && (
        <div className="bg-white border border-black/6 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-[10px] font-bold uppercase tracking-widest text-secondary bg-surface-container/40">
                  <th className="px-5 py-3.5 text-left">Date</th>
                  <th className="px-4 py-3.5 text-left">Customer</th>
                  <th className="px-4 py-3.5 text-left">Items</th>
                  <th className="px-4 py-3.5 text-right">Total</th>
                  <th className="px-4 py-3.5 text-left">Status</th>
                  <th className="px-4 py-3.5 text-left">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {orders.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-16 text-center text-secondary text-sm">No orders yet.</td></tr>
                ) : orders.map(o => (
                  <tr key={o.id} className="hover:bg-surface-container/30 transition-colors">
                    <td className="px-5 py-4 text-secondary text-xs whitespace-nowrap">{formatRelativeTime(o.created_at)}</td>
                    <td className="px-4 py-4 text-xs text-secondary">{o.customer_name ?? "Guest"}{o.table_number ? ` · T${o.table_number}` : ""}</td>
                    <td className="px-4 py-4 text-xs text-secondary truncate max-w-[200px]">{(o.items ?? []).map(i => `${i.name} ×${i.quantity}`).join(", ") || "—"}</td>
                    <td className="px-4 py-4 text-right font-mono text-sm font-bold whitespace-nowrap">{o.total?.toLocaleString()} RWF</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${ORDER_STATUS_STYLES[o.status] ?? ""}`}>
                        {o.status.replace("_", " ")}
                      </span>
                    </td>
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
        <div className="bg-white border border-black/6 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-[10px] font-bold uppercase tracking-widest text-secondary bg-surface-container/40">
                  <th className="px-5 py-3.5 text-left">Date</th>
                  <th className="px-4 py-3.5 text-left">Plan</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-4 py-3.5 text-left">Status</th>
                  <th className="px-4 py-3.5 text-left">Deposit ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {transactions.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-16 text-center text-secondary text-sm">No transactions yet.</td></tr>
                ) : transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-surface-container/30 transition-colors">
                    <td className="px-5 py-4 text-secondary text-xs whitespace-nowrap">{formatRelativeTime(tx.createdAt)}</td>
                    <td className="px-4 py-4 text-xs font-mono text-secondary capitalize">{tx.plan}</td>
                    <td className="px-4 py-4 text-right font-mono text-sm font-bold whitespace-nowrap">{tx.amount.toLocaleString()} {tx.currency}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${TX_STATUS_STYLES[tx.status] ?? ""}`}>
                        {tx.status}
                      </span>
                    </td>
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
