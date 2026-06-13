"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils";
import type { RestaurantRow } from "@/app/api/admin/restaurants/route";

const PLAN_STYLES: Record<string, { label: string; className: string }> = {
  free:     { label: "Free",     className: "bg-surface-container text-secondary" },
  trial:    { label: "Trial",    className: "bg-violet-500/10 text-violet-600" },
  pro:      { label: "Pro",      className: "bg-emerald-500/10 text-emerald-700" },
  business: { label: "Business", className: "bg-amber-500/10 text-amber-700" },
};

const PLAN_OPTIONS = ["free", "pro", "business"] as const;
type Plan = (typeof PLAN_OPTIONS)[number];

interface OverrideState {
  restaurants: RestaurantRow[];
  plan: Plan;
  expiryDays: number;
}

interface DeleteState {
  restaurants: RestaurantRow[];
  confirmed: boolean;
}

const REFRESH_COOLDOWN_MS = 30_000;
const PAGE_SIZE = 10;

export default function AdminRestaurantsPage() {
  const [rows, setRows] = useState<RestaurantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [override, setOverride] = useState<OverrideState | null>(null);
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const cooldownRef = useRef(false);

  const load = useCallback((manual = false) => {
    if (manual && cooldownRef.current) return;
    setLoading(true);
    if (manual) {
      cooldownRef.current = true;
      setCooldown(true);
      setTimeout(() => { cooldownRef.current = false; setCooldown(false); }, REFRESH_COOLDOWN_MS);
    }
    fetch("/api/admin/restaurants")
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `Server error ${r.status}`);
        return d;
      })
      .then(d => { setRows(d.restaurants ?? []); setSelected(new Set()); setPage(1); })
      .catch((err: unknown) => toast.error((err as Error).message || "Failed to load restaurants"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); setSelected(new Set()); }, [search, planFilter]);

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || (r.ownerEmail ?? "").toLowerCase().includes(q);
    const matchPlan = planFilter === "all" || r.resolvedPlan === planFilter;
    return matchSearch && matchPlan;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allPageSelected = paginated.length > 0 && paginated.every(r => selected.has(r.id));
  const somePageSelected = paginated.some(r => selected.has(r.id));
  const selectedRows = rows.filter(r => selected.has(r.id));

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelected(prev => { const n = new Set(prev); paginated.forEach(r => n.delete(r.id)); return n; });
    } else {
      setSelected(prev => { const n = new Set(prev); paginated.forEach(r => n.add(r.id)); return n; });
    }
  };

  const toggleSelect = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleOverrideSave = async () => {
    if (!override) return;
    setSaving(true);
    try {
      const results = await Promise.all(
        override.restaurants.map(restaurant =>
          fetch("/api/admin/set-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              restaurantId: restaurant.id,
              plan: override.plan,
              expiryDays: override.plan === "free" ? undefined : override.expiryDays,
            }),
          }).then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed");
            return { id: restaurant.id, planExpiresAt: (data.restaurant?.plan_expires_at ?? null) as string | null };
          })
        )
      );
      const resultMap = new Map(results.map(r => [r.id, r.planExpiresAt]));
      setRows(prev => prev.map(r =>
        resultMap.has(r.id)
          ? { ...r, plan: override.plan, resolvedPlan: override.plan, planExpiresAt: resultMap.get(r.id) ?? null }
          : r
      ));
      const n = override.restaurants.length;
      toast.success(`Updated ${n} restaurant${n > 1 ? "s" : ""} to ${override.plan}`);
      setSelected(new Set());
      setOverride(null);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteState?.confirmed) return;
    setDeleting(true);
    try {
      const results = await Promise.allSettled(
        deleteState.restaurants.map(restaurant =>
          fetch(`/api/admin/restaurants/${restaurant.id}`, { method: "DELETE" })
            .then(async res => {
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Failed to delete");
              return restaurant.id;
            })
        )
      );
      const deleted = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
        .map(r => r.value);
      const failed = results.filter(r => r.status === "rejected").length;
      if (deleted.length) {
        setRows(prev => prev.filter(r => !deleted.includes(r.id)));
        setSelected(prev => { const n = new Set(prev); deleted.forEach(id => n.delete(id)); return n; });
        toast.success(`Deleted ${deleted.length} restaurant${deleted.length > 1 ? "s" : ""}`);
      }
      if (failed) toast.error(`${failed} deletion${failed > 1 ? "s" : ""} failed`);
      setDeleteState(null);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(false);
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
    if (r.resolvedPlan === "trial" && r.trialEndsAt)
      return <span className="text-violet-500 text-xs">Trial · {formatRelativeTime(r.trialEndsAt)}</span>;
    if (r.planExpiresAt && r.plan !== "free")
      return <span className="text-amber-600 text-xs">Expires · {formatRelativeTime(r.planExpiresAt)}</span>;
    return <span className="text-secondary text-xs">—</span>;
  };

  const pageNumbers = (): (number | "…")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (page >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-on-surface tracking-tight">Restaurants</h1>
          <p className="text-sm text-secondary mt-0.5">
            {rows.length} total{filtered.length !== rows.length && ` · ${filtered.length} shown`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={loading || cooldown}
          title={cooldown ? "Wait 30s between refreshes" : undefined}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-secondary bg-white border border-black/6 hover:bg-surface-container rounded-xl shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>sync</span>
          {cooldown ? "Cooling down…" : "Refresh"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-secondary">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2 bg-white border border-black/6 rounded-xl text-sm text-on-surface shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "free", "trial", "pro", "business"].map(p => (
            <button
              type="button"
              key={p}
              onClick={() => setPlanFilter(p)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                planFilter === p
                  ? "bg-primary/10 text-primary"
                  : "bg-white border border-black/6 text-secondary hover:bg-surface-container shadow-sm"
              }`}
            >
              {p === "all" ? "All Plans" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-primary/5 border border-primary/15 rounded-xl">
          <span className="text-xs font-bold text-primary">{selected.size} selected</span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setOverride({ restaurants: selectedRows, plan: "free", expiryDays: 30 })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
            Override Plan
          </button>
          <button
            type="button"
            onClick={() => setDeleteState({ restaurants: selectedRows, confirmed: false })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-all"
          >
            <span className="material-symbols-outlined text-[14px]">delete</span>
            Delete Selected
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="px-2 py-1.5 text-[11px] font-bold text-secondary hover:text-on-surface transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      {loading && rows.length === 0 ? (
        <div className="flex items-center justify-center py-32">
          <span className="material-symbols-outlined text-[48px] text-secondary animate-spin">progress_activity</span>
        </div>
      ) : (
        <>
          <div className="bg-white border border-black/6 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-[10px] font-bold uppercase tracking-widest text-secondary bg-surface-container/40">
                    <th className="px-4 py-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                        onChange={toggleSelectAll}
                        aria-label="Select all on this page"
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />
                    </th>
                    <th className="px-5 py-3.5 text-left">Restaurant</th>
                    <th className="px-4 py-3.5 text-left">Owner</th>
                    <th className="px-4 py-3.5 text-left">Plan</th>
                    <th className="px-4 py-3.5 text-left">Trial / Expiry</th>
                    <th className="px-4 py-3.5 text-center">Menus</th>
                    <th className="px-4 py-3.5 text-center">Orders</th>
                    <th className="px-4 py-3.5 text-left">Joined</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-16 text-center text-secondary text-sm">
                        No restaurants found
                      </td>
                    </tr>
                  ) : (
                    paginated.map(r => (
                      <tr
                        key={r.id}
                        className={`hover:bg-surface-container/30 transition-colors ${selected.has(r.id) ? "bg-primary/[0.03]" : ""}`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selected.has(r.id)}
                            onChange={() => toggleSelect(r.id)}
                            aria-label={`Select ${r.name}`}
                            className="w-4 h-4 accent-primary cursor-pointer"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/restaurants/${r.id}`}
                            prefetch={false}
                            className="font-semibold text-on-surface hover:text-primary transition-colors truncate max-w-[180px] block"
                          >
                            {r.name}
                          </Link>
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
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setOverride({ restaurants: [r], plan: r.plan as Plan, expiryDays: 30 })}
                              className="px-3 py-1.5 text-[11px] font-bold bg-primary/8 text-primary hover:bg-primary/15 rounded-lg transition-all"
                            >
                              Override
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteState({ restaurants: [r], confirmed: false })}
                              className="px-3 py-1.5 text-[11px] font-bold bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-secondary">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-secondary hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                {pageNumbers().map((p, i) =>
                  p === "…" ? (
                    <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-secondary">…</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p as number)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        page === p ? "bg-primary text-white" : "text-secondary hover:bg-surface-container"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-secondary hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-7 shadow-2xl border border-black/6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-red-500 text-[24px]">warning</span>
            </div>
            <h2 className="font-bold text-lg text-on-surface mb-1">
              Delete {deleteState.restaurants.length > 1
                ? `${deleteState.restaurants.length} Restaurants`
                : "Restaurant"}
            </h2>
            <p className="text-sm text-secondary mb-4">
              {deleteState.restaurants.length === 1 ? (
                <>
                  This permanently deletes{" "}
                  <span className="font-semibold text-on-surface">{deleteState.restaurants[0].name}</span>,
                  all its menus, orders, and the owner&apos;s account.
                </>
              ) : (
                <>
                  This permanently deletes{" "}
                  <span className="font-semibold text-on-surface">{deleteState.restaurants.length} restaurants</span>
                  , all their menus, orders, and owner accounts.
                </>
              )}
              {" "}This cannot be undone.
            </p>
            {deleteState.restaurants.length > 1 && (
              <div className="mb-4 max-h-28 overflow-y-auto bg-surface-container-low rounded-xl px-3 py-2 space-y-1">
                {deleteState.restaurants.map(r => (
                  <p key={r.id} className="text-xs text-secondary truncate">
                    {r.name}
                    {r.ownerEmail && <span className="text-[10px] ml-1 opacity-70">({r.ownerEmail})</span>}
                  </p>
                ))}
              </div>
            )}
            <label className="flex items-center gap-3 p-3 bg-red-50 rounded-xl cursor-pointer mb-5">
              <input
                type="checkbox"
                checked={deleteState.confirmed}
                onChange={e => setDeleteState(s => s ? { ...s, confirmed: e.target.checked } : s)}
                className="w-4 h-4 accent-red-500"
              />
              <span className="text-xs font-bold text-red-700">I understand this is permanent and irreversible</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteState(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-surface-container text-secondary hover:bg-surface-container-high transition-all disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!deleteState.confirmed || deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting…" : deleteState.restaurants.length > 1 ? "Delete All" : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Override Modal */}
      {override && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-7 shadow-2xl border border-black/6">
            <h2 className="font-bold text-lg text-on-surface mb-1">Override Plan</h2>
            <div className="text-sm text-secondary mb-4">
              {override.restaurants.length === 1 ? (
                <>
                  <span className="font-semibold text-on-surface">{override.restaurants[0].name}</span>
                  {override.restaurants[0].ownerEmail && (
                    <span className="text-xs block mt-0.5">{override.restaurants[0].ownerEmail}</span>
                  )}
                </>
              ) : (
                <>
                  <span className="font-semibold text-on-surface">{override.restaurants.length} restaurants selected</span>
                  <div className="mt-2 max-h-24 overflow-y-auto bg-surface-container-low rounded-xl px-3 py-2 space-y-1">
                    {override.restaurants.map(r => (
                      <p key={r.id} className="text-xs text-secondary truncate">{r.name}</p>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2 block">
                  New Plan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PLAN_OPTIONS.map(p => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setOverride(o => o ? { ...o, plan: p } : o)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize border-2 transition-all ${
                        override.plan === p
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-black/8 text-secondary hover:border-primary/30"
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
                    onChange={e => setOverride(o => o ? { ...o, expiryDays: Math.max(1, Number(e.target.value)) } : o)}
                    aria-label="Expiry days"
                    placeholder="30"
                    className="w-full bg-surface-container-low rounded-xl px-4 py-2.5 text-sm border-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOverride(null)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-surface-container text-secondary hover:bg-surface-container-high transition-all disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOverrideSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:opacity-90 transition-all disabled:opacity-60"
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
