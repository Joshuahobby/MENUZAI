"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils";
import type { TransactionRow } from "@/app/api/admin/transactions/route";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-emerald-500/10 text-emerald-700" },
  pending:   { label: "Pending",   className: "bg-amber-500/10 text-amber-700"     },
  failed:    { label: "Failed",    className: "bg-red-500/10 text-red-600"         },
  expired:   { label: "Expired",   className: "bg-surface-container text-secondary" },
};

const STATUS_FILTERS = ["all", "pending", "completed", "failed", "expired"] as const;

export default function AdminTransactionsPage() {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/transactions")
      .then(r => r.json())
      .then(d => setRows(d.transactions ?? []))
      .catch(() => toast.error("Failed to load transactions"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? rows : rows.filter(r => r.status === filter);
  const completedRevenue = rows
    .filter(r => r.status === "completed")
    .reduce((s, r) => s + r.amount, 0);

  const handleCancel = async (txId: string) => {
    setCancellingId(txId);
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: txId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel");
      setRows(prev => prev.map(r => r.id === txId ? { ...r, status: "failed" } : r));
      toast.success("Transaction cancelled");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setCancellingId(null);
    }
  };

  const statusBadge = (status: string) => {
    const s = STATUS_STYLES[status] ?? STATUS_STYLES.expired;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${s.className}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-on-surface tracking-tight">Transactions</h1>
          <p className="text-sm text-secondary mt-0.5">{rows.length} total</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-secondary bg-white border border-black/6 hover:bg-surface-container rounded-xl shadow-sm transition-all disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>sync</span>
          Refresh
        </button>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="col-span-2 bg-gradient-to-br from-emerald-500/8 to-emerald-500/3 border border-emerald-500/15 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-700/70 uppercase tracking-widest mb-1.5">Completed Revenue</p>
          <p className="text-3xl font-extrabold font-[var(--font-headline)] text-emerald-700">
            {completedRevenue.toLocaleString()} RWF
          </p>
        </div>
        <div className="bg-white border border-black/6 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Total</p>
          <p className="text-3xl font-extrabold font-[var(--font-headline)] text-on-surface">{rows.length}</p>
        </div>
        <div className="bg-white border border-black/6 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">Completed</p>
          <p className="text-3xl font-extrabold font-[var(--font-headline)] text-emerald-700">
            {rows.filter(r => r.status === "completed").length}
          </p>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_FILTERS.map(f => (
          <button
            type="button"
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              filter === f
                ? "bg-primary/10 text-primary"
                : "bg-white border border-black/6 text-secondary hover:bg-surface-container shadow-sm"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex items-center justify-center py-32">
          <span className="material-symbols-outlined text-[48px] text-secondary animate-spin">progress_activity</span>
        </div>
      ) : (
        <div className="bg-white border border-black/6 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-[10px] font-bold uppercase tracking-widest text-secondary bg-surface-container/40">
                  <th className="px-5 py-3.5 text-left">Date</th>
                  <th className="px-4 py-3.5 text-left">Restaurant</th>
                  <th className="px-4 py-3.5 text-left">Owner</th>
                  <th className="px-4 py-3.5 text-left">Plan</th>
                  <th className="px-4 py-3.5 text-right">Amount</th>
                  <th className="px-4 py-3.5 text-left">Status</th>
                  <th className="px-4 py-3.5 text-left">Deposit ID</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-secondary text-sm">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filtered.map(tx => (
                    <tr key={tx.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="px-5 py-4 text-secondary text-xs whitespace-nowrap">
                        {formatRelativeTime(tx.createdAt)}
                      </td>
                      <td className="px-4 py-4 font-semibold text-on-surface truncate max-w-[160px]">
                        {tx.restaurantName ?? <span className="text-secondary">—</span>}
                      </td>
                      <td className="px-4 py-4 text-secondary text-xs truncate max-w-[180px]">
                        {tx.ownerEmail ?? "—"}
                      </td>
                      <td className="px-4 py-4 text-xs font-mono text-secondary capitalize">{tx.plan}</td>
                      <td className="px-4 py-4 text-right font-mono text-sm font-bold text-on-surface whitespace-nowrap">
                        {tx.amount.toLocaleString()} {tx.currency}
                      </td>
                      <td className="px-4 py-4">{statusBadge(tx.status)}</td>
                      <td className="px-4 py-4 text-[10px] font-mono text-secondary truncate max-w-[140px]" title={tx.depositId}>
                        {tx.depositId}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {tx.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleCancel(tx.id)}
                            disabled={cancellingId === tx.id}
                            className="px-2.5 py-1 text-[11px] font-bold bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-all disabled:opacity-60"
                          >
                            {cancellingId === tx.id ? "…" : "Cancel"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
