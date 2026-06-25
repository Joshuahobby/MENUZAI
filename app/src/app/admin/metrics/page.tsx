"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { getPlanMeta } from "@/lib/plans";

interface RecentRestaurant {
  id: string;
  name: string;
  plan: string;
  trial_ends_at: string | null;
  created_at: string;
}

interface Metrics {
  totalRestaurants: number;
  freeLiteCount: number;
  trialCount: number;
  proCount: number;
  businessCount: number;
  mrrRwf: number;
  proPrice: number;
  businessPrice: number;
  totalOrders: number;
  ordersToday: number;
  aiWaiterOrders: number;
  totalMenus: number;
  publishedMenus: number;
  recentRestaurants: RecentRestaurant[];
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
  success: "bg-tertiary",
  error:   "bg-error",
  running: "bg-accent-saffron animate-pulse",
  never:   "bg-accent-saffron",
};

const CRON_BG: Record<string, string> = {
  success: "",
  error:   "bg-error-container/50",
  running: "bg-accent-saffron/10",
  never:   "bg-accent-saffron/10",
};

const CRON_TEXT: Record<string, string> = {
  success: "text-tertiary",
  error:   "text-error",
  running: "text-amber-600",
  never:   "text-amber-600",
};

const CRON_LABEL: Record<string, string> = {
  success: "OK",
  error:   "Error",
  running: "Running",
  never:   "Not yet run",
};

const JOB_LABELS: Record<string, string> = {
  "expire-transactions":  "Expire Transactions",
  "expire-subscriptions": "Expire Subscriptions",
  "remind-subscriptions": "Remind Subscriptions",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-RW").format(n);
}

function KpiCard({
  label, value, sub, icon, accent, href,
}: {
  label: string; value: string | number; sub?: string;
  icon: string; accent: string; href?: string;
}) {
  const inner = (
    <div className={`bg-surface-container-lowest border border-black/6 rounded-2xl p-5 h-full ${href ? "hover:border-primary/20 hover:shadow-md transition-colors" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
          <span className="material-symbols-outlined text-[16px] icon-fill">{icon}</span>
        </div>
      </div>
      <p className="text-2xl font-extrabold font-headline text-on-surface">{value}</p>
      {sub && <p className="text-xs text-secondary mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}

function PlanBar({ metrics }: { metrics: Metrics }) {
  const total = metrics.totalRestaurants || 1;
  const segments = [
    { key: "trial",    count: metrics.trialCount,    dot: "bg-primary/70", textColor: "text-primary", bg: "bg-primary/5",  label: "Trial"     },
    { key: "pro",      count: metrics.proCount,      dot: "bg-primary",    textColor: "text-primary",    bg: "bg-primary/5",  label: "Pro"        },
    { key: "business", count: metrics.businessCount, dot: "bg-tertiary",   textColor: "text-tertiary",   bg: "bg-tertiary/5", label: "Business"   },
    { key: "free",     count: metrics.freeLiteCount, dot: "bg-secondary/30",  textColor: "text-secondary",  bg: "bg-surface-container-low",   label: "Free Lite"  },
  ];

  return (
    <div className="bg-surface-container-lowest border border-black/6 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-black/6">
        <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Plan Distribution</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {segments.map((s, i) => {
          const pct = Math.round((s.count / total) * 100);
          return (
            <div
              key={s.key}
              className={`${s.bg} p-5 ${i < 3 ? "border-r border-black/6" : ""} ${i >= 2 ? "border-t sm:border-t-0 border-black/6" : ""}`}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${s.dot} mb-3`} />
              <p className={`text-2xl font-extrabold font-headline ${s.textColor}`}>{s.count}</p>
              <p className="text-xs font-bold text-secondary mt-0.5">{s.label}</p>
              <p className="text-[11px] text-secondary/50 mt-0.5">{pct}% of total</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function resolvePlan(r: RecentRestaurant): string {
  if (r.plan !== "free") return r.plan;
  if (r.trial_ends_at && new Date(r.trial_ends_at) > new Date()) return "trial";
  return "free";
}

const REFRESH_COOLDOWN_MS = 30_000;

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [cronStatuses, setCronStatuses] = useState<CronStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const cooldownRef = useRef(false);

  const loadMetrics = useCallback((manual = false) => {
    if (manual && cooldownRef.current) return;
    setLoading(true);
    setError(null);
    if (manual) {
      cooldownRef.current = true;
      setCooldown(true);
      setTimeout(() => { cooldownRef.current = false; setCooldown(false); }, REFRESH_COOLDOWN_MS);
    }
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

  // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch, not cascading
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
          onClick={() => loadMetrics(true)}
          disabled={loading || cooldown}
          title={cooldown ? "Wait 30s between refreshes" : undefined}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-secondary bg-surface-container-lowest border border-black/6 hover:bg-surface-container rounded-xl shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>sync</span>
          {cooldown ? "Cooling down…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-container/50 border border-error/20 text-error text-sm rounded-xl">{error}</div>
      )}

      {loading && !metrics ? (
        <div className="flex items-center justify-center py-32">
          <span className="material-symbols-outlined text-[48px] text-secondary animate-spin">progress_activity</span>
        </div>
      ) : metrics ? (
        <div className="space-y-6">

          {/* MRR hero */}
          <div className="bg-linear-to-br from-primary/8 to-primary-container/5 border border-primary/15 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest mb-2">
                  Estimated Monthly Revenue
                </p>
                <p className="text-4xl font-extrabold font-headline text-primary">
                  {fmt(metrics.mrrRwf)} RWF
                </p>
                <p className="text-xs text-secondary mt-1.5">
                  {metrics.proCount} Pro ({fmt(metrics.proPrice)} RWF) + {metrics.businessCount} Business ({fmt(metrics.businessPrice)} RWF) active subscribers
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[24px] icon-fill">trending_up</span>
              </div>
            </div>
          </div>

          {/* Plan distribution */}
          <PlanBar metrics={metrics} />

          {/* Primary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Restaurants" value={metrics.totalRestaurants} sub="all plans"    icon="storefront"       accent="bg-primary/10 text-primary"     href="/admin/restaurants" />
            <KpiCard label="Pro Subscribers"   value={metrics.proCount}         sub="paid plan"    icon="workspace_premium" accent="bg-tertiary/10 text-tertiary" href="/admin/subscriptions" />
            <KpiCard label="Business"          value={metrics.businessCount}    sub="paid plan"    icon="domain"            accent="bg-accent-saffron/15 text-amber-600"    href="/admin/subscriptions" />
            <KpiCard label="On Trial"          value={metrics.trialCount}       sub="14-day trial" icon="hourglass_top"     accent="bg-primary/10 text-primary" />
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Free Lite"    value={metrics.freeLiteCount}                    sub="trial expired"      icon="lock_open"    accent="bg-surface-container-low text-secondary" />
            <KpiCard label="Total Orders" value={fmt(metrics.totalOrders)}                 sub="all time"           icon="receipt_long" accent="bg-primary/10 text-primary"  href="/admin/transactions" />
            <KpiCard label="Orders Today" value={metrics.ordersToday}                      sub="since midnight UTC" icon="today"        accent="bg-primary/10 text-primary" />
            <KpiCard label="AI Waiter"    value={metrics.aiWaiterOrders}                   sub="in-chat orders"     icon="smart_toy"    accent="bg-primary/10 text-primary" />
          </div>

          {/* Menus row */}
          <div className="grid grid-cols-2 gap-4">
            <KpiCard label="Total Menus"     value={metrics.totalMenus}     sub="across all restaurants" icon="menu_book" accent="bg-primary/10 text-primary" />
            <KpiCard label="Published Menus" value={metrics.publishedMenus} sub="live on public URLs"     icon="public"    accent="bg-tertiary/10 text-tertiary" />
          </div>

          {/* Two-column bottom section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent sign-ups */}
            <div className="bg-surface-container-lowest border border-black/6 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-black/6 flex items-center justify-between">
                <p className="text-xs font-bold text-secondary uppercase tracking-widest">Recent Sign-ups</p>
                <Link href="/admin/restaurants" className="text-[11px] font-bold text-primary hover:opacity-80">
                  View all →
                </Link>
              </div>
              {metrics.recentRestaurants.length === 0 ? (
                <p className="px-5 py-6 text-sm text-secondary">No restaurants yet.</p>
              ) : (
                <div className="divide-y divide-black/5">
                  {metrics.recentRestaurants.map(r => {
                    const effectivePlan = resolvePlan(r);
                    const meta = getPlanMeta(effectivePlan);
                    return (
                      <Link
                        key={r.id}
                        href={`/admin/restaurants/${r.id}`}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-surface-container transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary text-[15px] icon-fill">storefront</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">{r.name || "Unnamed"}</p>
                          <p className="text-[11px] text-secondary">{formatRelativeTime(r.created_at)}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cron health */}
            <div className="bg-surface-container-lowest border border-black/6 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-black/6">
                <p className="text-xs font-bold text-secondary uppercase tracking-widest">Cron Job Health</p>
              </div>
              {cronStatuses.length === 0 ? (
                <p className="px-5 py-6 text-sm text-secondary">No cron data yet — run migration 025 first.</p>
              ) : (
                <div className="divide-y divide-black/5">
                  {cronStatuses.map(c => (
                    <div key={c.jobName} className={`flex items-center gap-4 px-5 py-4 ${CRON_BG[c.status]}`}>
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${CRON_DOT[c.status]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface">
                          {JOB_LABELS[c.jobName] ?? c.jobName}
                        </p>
                        <p className="text-[11px] text-secondary">{c.schedule}</p>
                        {c.errorMessage && (
                          <p className="text-[11px] text-error truncate mt-0.5" title={c.errorMessage}>
                            {c.errorMessage}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-bold ${CRON_TEXT[c.status]}`}>
                          {CRON_LABEL[c.status]}
                        </p>
                        {c.lastRun ? (
                          <p className="text-[11px] text-secondary">{formatRelativeTime(c.lastRun)}</p>
                        ) : (
                          <p className="text-[11px] text-amber-500">Awaiting first run</p>
                        )}
                        {c.status === "success" && c.rowsAffected > 0 && (
                          <p className="text-[11px] text-secondary">{c.rowsAffected} rows</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      ) : null}
    </div>
  );
}
