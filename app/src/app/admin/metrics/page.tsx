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

const CRON_STATUS_STYLE = {
  success: { dot: "bg-green-500",  label: "OK",      text: "text-green-600" },
  error:   { dot: "bg-red-500",    label: "Error",   text: "text-red-500"   },
  running: { dot: "bg-amber-400 animate-pulse", label: "Running", text: "text-amber-600" },
  never:   { dot: "bg-surface-container-high",  label: "Never",   text: "text-secondary"  },
};

const JOB_LABELS: Record<string, string> = {
  "expire-transactions":  "Expire Transactions",
  "expire-subscriptions": "Expire Subscriptions",
  "remind-subscriptions": "Remind Subscriptions",
};

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
      fetch("/api/admin/metrics").then((r) => r.json()),
      fetch("/api/admin/cron-status").then((r) => r.json()),
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

  const stat = (label: string, value: string | number, sub?: string, color = "text-on-surface") => (
    <div className="bg-surface-container-lowest rounded-3xl p-6 border border-surface-container/50">
      <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-extrabold font-[var(--font-headline)] ${color}`}>{value}</p>
      {sub && <p className="text-xs text-secondary mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="p-6 lg:p-10 pb-24 lg:pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-2xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">
            Platform Metrics
          </h1>
          <p className="text-secondary text-sm">
            {lastFetched ? `as of ${lastFetched.toLocaleTimeString()}` : "Live snapshot — admin only"}
          </p>
        </div>
        <button
          onClick={loadMetrics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-secondary bg-surface-container hover:bg-surface-container-high rounded-xl transition-all disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>sync</span>
          Refresh
        </button>
      </div>

      {error && <p className="text-center text-error mb-8">{error}</p>}

      {loading && !metrics ? (
        <div className="flex items-center justify-center py-24">
          <span className="material-symbols-outlined text-[48px] text-secondary animate-spin">progress_activity</span>
        </div>
      ) : metrics ? (
        <>
          <section className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">Revenue</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stat("MRR (est.)", `${metrics.mrrRwf.toLocaleString()} RWF`, "Pro × 35K + Business × 89K", "text-primary")}
              {stat("Pro Restaurants", metrics.proCount, "paid plan")}
              {stat("Business", metrics.businessCount, "paid plan")}
              {stat("On Trial", metrics.trialCount, "14-day trial")}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">Restaurants</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stat("Total", metrics.totalRestaurants)}
              {stat("Free", metrics.freeCount)}
              {stat("Total Menus", metrics.totalMenus)}
              {stat("Published", metrics.publishedMenus, "live menus")}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">Orders</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {stat("Total Orders", metrics.totalOrders.toLocaleString())}
              {stat("Today", metrics.ordersToday, "since midnight UTC")}
              {stat("AI Waiter Orders", metrics.aiWaiterOrders, "via in-chat ordering", "text-violet-600")}
            </div>
          </section>

          {/* Cron Jobs */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">Cron Jobs</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {cronStatuses.length === 0 ? (
                <p className="text-sm text-secondary col-span-3">
                  No cron data yet — run migrations 025 first.
                </p>
              ) : (
                cronStatuses.map((c) => {
                  const s = CRON_STATUS_STYLE[c.status];
                  return (
                    <div
                      key={c.jobName}
                      className="bg-surface-container-lowest rounded-3xl p-5 border border-surface-container/50"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${s.text}`}>
                          {s.label}
                        </span>
                      </div>
                      <p className="font-semibold text-sm text-on-surface mb-0.5">
                        {JOB_LABELS[c.jobName] ?? c.jobName}
                      </p>
                      <p className="text-[11px] text-secondary mb-2">{c.schedule}</p>
                      {c.lastRun ? (
                        <>
                          <p className="text-[11px] text-secondary">
                            Last run: {formatRelativeTime(c.lastRun)}
                          </p>
                          <p className="text-[11px] text-secondary">
                            Rows affected: <span className="font-bold text-on-surface">{c.rowsAffected}</span>
                          </p>
                        </>
                      ) : (
                        <p className="text-[11px] text-secondary">Never run</p>
                      )}
                      {c.errorMessage && (
                        <p className="text-[11px] text-red-500 mt-1 truncate" title={c.errorMessage}>
                          {c.errorMessage}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
