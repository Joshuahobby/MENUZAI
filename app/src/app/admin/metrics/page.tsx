"use client";

import { useEffect, useState, useCallback } from "react";
import { formatRelativeTime } from "@/lib/utils";

interface Metrics {
  totalRestaurants: number;
  freeCount: number;
  trialCount: number;
  proCount: number;
  businessCount: number;
  mrrRwf: number;
  totalOrders: number;
  ordersToday: number;
  aiWaiterOrders: number;
  totalMenus: number;
  publishedMenus: number;
}

interface CronStatus {
  jobName: string;
  schedule: string;
  lastRun: string | null;
  completedAt: string | null;
  status: "success" | "error" | "running" | "never";
  rowsAffected: number;
  errorMessage: string | null;
}

const CRON_DOT: Record<string, string> = {
  success: "bg-emerald-500",
  error:   "bg-red-500",
  running: "bg-amber-400 animate-pulse",
  never:   "bg-slate-300",
};

const CRON_TEXT: Record<string, string> = {
  success: "text-emerald-600",
  error:   "text-red-500",
  running: "text-amber-600",
  never:   "text-secondary",
};

const CRON_LABEL: Record<string, string> = {
  success: "OK",
  error:   "Error",
  running: "Running",
  never:   "Never",
};

const JOB_LABELS: Record<string, string> = {
  "expire-transactions":  "Expire Transactions",
  "expire-subscriptions": "Expire Subscriptions",
  "remind-subscriptions": "Remind Subscriptions",
};

function KpiCard({
  label, value, sub, icon, accent,
}: {
  label: string; value: string | number; sub?: string;
  icon: string; accent: string;
}) {
  return (
    <div className="bg-white border border-black/6 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
          <span className="material-symbols-outlined text-[16px] icon-fill">{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-extrabold font-[var(--font-headline)] text-on-surface">{value}</p>
      {sub && <p className="text-xs text-secondary mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [cronStatuses, setCronStatuses] = useState<CronStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const loadMetrics = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/admin/metrics").then(r => r.json()),
      fetch("/api/admin/cron-status").then(r => r.json()),
    ])
      .then(([m, c]) => {
        setMetrics(m);
        if (Array.isArray(c)) setCronStatuses(c);
        setLastFetched(new Date());
      })
      .catch(() => setError("Failed to load metrics."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-on-surface tracking-tight">Platform Metrics</h1>
          <p className="text-sm text-secondary mt-0.5">
            {lastFetched ? `Updated ${lastFetched.toLocaleTimeString()}` : "Live snapshot — admin only"}
          </p>
        </div>
        <button
          type="button"
          onClick={loadMetrics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-secondary bg-white border border-black/6 hover:bg-surface-container rounded-xl shadow-sm transition-all disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>sync</span>
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading && !metrics ? (
        <div className="flex items-center justify-center py-32">
          <span className="material-symbols-outlined text-[48px] text-secondary animate-spin">progress_activity</span>
        </div>
      ) : metrics ? (
        <div className="space-y-6">
          {/* MRR hero */}
          <div className="bg-gradient-to-br from-primary/8 to-primary-container/5 border border-primary/15 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-2">
                  Estimated Monthly Revenue
                </p>
                <p className="text-4xl font-extrabold font-[var(--font-headline)] text-primary">
                  {metrics.mrrRwf.toLocaleString()} RWF
                </p>
                <p className="text-xs text-secondary mt-1.5">
                  Pro × 35,000 + Business × 89,000 RWF/mo
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[24px] icon-fill">trending_up</span>
              </div>
            </div>
          </div>

          {/* Primary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Restaurants" value={metrics.totalRestaurants} sub="all plans" icon="storefront" accent="bg-blue-500/10 text-blue-600" />
            <KpiCard label="Pro Subscribers"   value={metrics.proCount}         sub="paid plan"  icon="workspace_premium" accent="bg-emerald-500/10 text-emerald-600" />
            <KpiCard label="Business"          value={metrics.businessCount}    sub="paid plan"  icon="business" accent="bg-amber-500/10 text-amber-600" />
            <KpiCard label="On Trial"          value={metrics.trialCount}       sub="14-day trial" icon="hourglass_top" accent="bg-violet-500/10 text-violet-600" />
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Free Tier"       value={metrics.freeCount}                   sub="no active plan"   icon="person" accent="bg-surface-container text-secondary" />
            <KpiCard label="Total Orders"    value={metrics.totalOrders.toLocaleString()} sub="all time"        icon="receipt_long" accent="bg-primary/10 text-primary" />
            <KpiCard label="Orders Today"    value={metrics.ordersToday}                 sub="since midnight UTC" icon="today" accent="bg-primary/10 text-primary" />
            <KpiCard label="AI Waiter"       value={metrics.aiWaiterOrders}              sub="in-chat orders"   icon="smart_toy" accent="bg-violet-500/10 text-violet-600" />
          </div>

          {/* Menus row */}
          <div className="grid grid-cols-2 gap-4">
            <KpiCard label="Total Menus"     value={metrics.totalMenus}     sub="across all restaurants" icon="menu_book" accent="bg-blue-500/10 text-blue-600" />
            <KpiCard label="Published Menus" value={metrics.publishedMenus} sub="live on public URLs"     icon="public"    accent="bg-emerald-500/10 text-emerald-600" />
          </div>

          {/* Cron health */}
          <div className="bg-white border border-black/6 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-black/6">
              <p className="text-xs font-bold text-secondary uppercase tracking-widest">Cron Job Health</p>
            </div>
            {cronStatuses.length === 0 ? (
              <p className="px-5 py-6 text-sm text-secondary">
                No cron data yet — run migration 025 first.
              </p>
            ) : (
              <div className="divide-y divide-black/5">
                {cronStatuses.map(c => (
                  <div key={c.jobName} className="flex items-center gap-4 px-5 py-4">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${CRON_DOT[c.status]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-on-surface">
                        {JOB_LABELS[c.jobName] ?? c.jobName}
                      </p>
                      <p className="text-[11px] text-secondary">{c.schedule}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-bold ${CRON_TEXT[c.status]}`}>
                        {CRON_LABEL[c.status]}
                      </p>
                      {c.lastRun && (
                        <p className="text-[11px] text-secondary">{formatRelativeTime(c.lastRun)}</p>
                      )}
                      {c.status === "success" && c.rowsAffected > 0 && (
                        <p className="text-[11px] text-secondary">{c.rowsAffected} rows</p>
                      )}
                    </div>
                    {c.errorMessage && (
                      <p
                        className="text-[11px] text-red-500 truncate max-w-[200px]"
                        title={c.errorMessage}
                      >
                        {c.errorMessage}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
