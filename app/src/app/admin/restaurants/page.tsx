"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils";
import type { RestaurantRow } from "@/app/api/admin/restaurants/route";

const PLAN_STYLES: Record<string, { label: string; className: string }> = {
  free:     { label: "Free",     className: "bg-surface-container text-secondary" },
  trial:    { label: "Trial",    className: "bg-violet-500/10 text-violet-600" },
  pro:      { label: "Pro",      className: "bg-green-500/10 text-green-700" },
  business: { label: "Business", className: "bg-amber-500/10 text-amber-700" },
};

const PLAN_OPTIONS = ["free", "pro", "business"] as const;
type Plan = (typeof PLAN_OPTIONS)[number];

interface OverrideState {
  restaurant: RestaurantRow;
  plan: Plan;
  expiryDays: number;
}

export default function AdminRestaurantsPage() {
  const [rows, setRows] = useState<RestaurantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [override, setOverride] = useState<OverrideState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/restaurants")
      .then((r) => r.json())
      .then((d) => setRows(d.restaurants ?? []))
      .catch(() => toast.error("Failed to load restaurants"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || (r.ownerEmail ?? "").toLowerCase().includes(q);
    const matchPlan = planFilter === "all" || r.resolvedPlan === planFilter;
    return matchSearch && matchPlan;
  });

  const handleOverrideSave = async () => {
    if (!override) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/set-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: override.restaurant.id,
          plan: override.plan,
          expiryDays: override.plan === "free" ? undefined : override.expiryDays,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(`Plan updated to ${override.plan}`);
      setRows((prev) =>
        prev.map((r) =>
          r.id === override.restaurant.id
            ? {
                ...r,
                plan: override.plan,
                resolvedPlan: override.plan,
                planExpiresAt: data.restaurant?.plan_expires_at ?? null,
              }
            : r
        )
      );
      setOverride(null);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const planBadge = (resolved: string) => {
    const s = PLAN_STYLES[resolved] ?? PLAN_STYLES.free;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${s.className}`}>
        {s.label}
      </span>
    );
  };

  const expiryCell = (r: RestaurantRow) => {
    if (r.resolvedPlan === "trial" && r.trialEndsAt) {
      return <span className="text-violet-500 text-xs">Trial · {formatRelativeTime(r.trialEndsAt)}</span>;
    }
    if (r.planExpiresAt && r.plan !== "free") {
      return <span className="text-amber-600 text-xs">Expires · {formatRelativeTime(r.planExpiresAt)}</span>;
    }
    return <span className="text-secondary text-xs">—</span>;
  };

  return (
    <div className="p-6 lg:p-10 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">Restaurants</h1>
          <p className="text-sm text-secondary">{rows.length} total</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-secondary bg-surface-container hover:bg-surface-container-high rounded-xl transition-all disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>sync</span>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 min-w-[200px] bg-surface-container-low rounded-xl px-4 py-2 text-sm text-on-surface border-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="flex gap-2 flex-wrap">
          {["all", "free", "trial", "pro", "business"].map((p) => (
            <button
              key={p}
              onClick={() => setPlanFilter(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                planFilter === p
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container text-secondary hover:bg-surface-container-high"
              }`}
            >
              {p === "all" ? "All Plans" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading && rows.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <span className="material-symbols-outlined text-[48px] text-secondary animate-spin">progress_activity</span>
        </div>
      ) : (
        <div className="bg-surface-container-lowest border border-surface-container rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-container text-[10px] font-bold uppercase tracking-widest text-secondary">
                  <th className="px-5 py-3 text-left">Restaurant</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Trial / Expiry</th>
                  <th className="px-4 py-3 text-center">Menus</th>
                  <th className="px-4 py-3 text-center">Orders</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-secondary text-sm">
                      No restaurants found
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-container/40 transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/admin/restaurants/${r.id}`} className="font-semibold text-on-surface hover:text-primary transition-colors truncate max-w-[180px] block">{r.name}</Link>
                        {r.slug && (
                          <span className="text-[10px] text-secondary font-mono">/menu/{r.slug}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-secondary text-xs truncate max-w-[180px]">
                        {r.ownerEmail ?? "—"}
                      </td>
                      <td className="px-4 py-4">{planBadge(r.resolvedPlan)}</td>
                      <td className="px-4 py-4">{expiryCell(r)}</td>
                      <td className="px-4 py-4 text-center text-secondary font-mono text-xs">{r.menuCount}</td>
                      <td className="px-4 py-4 text-center text-secondary font-mono text-xs">{r.orderCount}</td>
                      <td className="px-4 py-4 text-secondary text-xs whitespace-nowrap">
                        {formatRelativeTime(r.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() =>
                            setOverride({
                              restaurant: r,
                              plan: r.plan as Plan,
                              expiryDays: 30,
                            })
                          }
                          className="px-3 py-1.5 text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all"
                        >
                          Override Plan
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plan Override Modal */}
      {override && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-surface-container">
            <h2 className="font-[var(--font-headline)] font-extrabold text-lg mb-1 text-on-surface">
              Override Plan
            </h2>
            <p className="text-sm text-secondary mb-6">
              <span className="font-semibold text-on-surface">{override.restaurant.name}</span>
              {override.restaurant.ownerEmail && (
                <span className="text-xs block mt-0.5">{override.restaurant.ownerEmail}</span>
              )}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2 block">
                  New Plan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PLAN_OPTIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setOverride((o) => o ? { ...o, plan: p } : o)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize border-2 transition-all ${
                        override.plan === p
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-surface-container text-secondary hover:border-primary/30"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {override.plan !== "free" && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2 block">
                    Expires in (days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={override.expiryDays}
                    onChange={(e) =>
                      setOverride((o) => o ? { ...o, expiryDays: Math.max(1, Number(e.target.value)) } : o)
                    }
                    className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-sm text-on-surface border-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setOverride(null)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-surface-container text-secondary hover:bg-surface-container-high transition-all disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-60"
              >
                {saving ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
