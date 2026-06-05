"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils";
import type { TransactionRow } from "@/app/api/admin/transactions/route";

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-green-500/10 text-green-700" },
  pending:   { label: "Pending",   className: "bg-amber-500/10 text-amber-700" },
  failed:    { label: "Failed",    className: "bg-red-500/10 text-red-600"     },
  expired:   { label: "Expired",   className: "bg-surface-container text-secondary" },
};

const STATUS_FILTERS = ["all", "pending", "completed", "failed", "expired"] as const;

export default function AdminTransactionsPage() {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

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
  const completedRevenue = rows.filter(r => r.status === "completed").reduce((s, r) => s + r.amount, 0);

  const statusBadge = (status: string) => {
    const s = STATUS_STYLES[status] ?? STATUS_STYLES.expired;
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${s.className}`}>{s.label}</span>;
  };

  return (
    <div className="p-6 lg:p-10 pb-24 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">Transactions</h1>
          <p className="text-sm text-secondary">
            {rows.length} total &nbsp;·&nbsp;
            <span className="text-green-700 font-bold">{completedRevenue.toLocaleString()} RWF</span> completed revenue
          </p>
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

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              filter === f
                ? "bg-primary/10 text-primary"
                : "bg-surface-container text-secondary hover:bg-surface-container-high"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

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
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Restaurant</th>
                  <th className="px-4 py-3 text-left">Owner</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Deposit ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-secondary text-sm">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filtered.map(tx => (
                    <tr key={tx.id} className="hover:bg-surface-container/40 transition-colors">
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
