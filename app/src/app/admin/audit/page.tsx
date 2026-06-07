"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils";

interface AuditEntry {
  id: string;
  action: string;
  performed_by: string;
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_STYLES: Record<string, { label: string; iconClass: string; icon: string; badge: string }> = {
  plan_override:    { label: "Plan Override",    icon: "swap_horiz", iconClass: "bg-amber-500/10 text-amber-600",  badge: "bg-amber-500/10 text-amber-700" },
  ai_config_change: { label: "AI Config Change", icon: "smart_toy",  iconClass: "bg-blue-500/10 text-blue-600",    badge: "bg-blue-500/10 text-blue-700"   },
};

function summarise(entry: AuditEntry): string {
  if (entry.action === "plan_override") {
    const oldPlan = (entry.old_value?.plan as string) ?? "?";
    const newPlan = (entry.new_value?.plan as string) ?? "?";
    const days = entry.new_value?.expiryDays as number | null;
    return `${oldPlan} → ${newPlan}${days ? ` · ${days} days` : ""}`;
  }
  if (entry.action === "ai_config_change") {
    const oldP = (entry.old_value?.provider as string) ?? "?";
    const newP = (entry.new_value?.provider as string) ?? "?";
    const newM = (entry.new_value?.model as string) ?? "";
    return `${oldP} → ${newP} · ${newM}`;
  }
  return "—";
}

const FILTER_OPTIONS = [
  { value: "all",              label: "All Actions" },
  { value: "plan_override",    label: "Plan Overrides" },
  { value: "ai_config_change", label: "Config Changes" },
];

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/audit-log")
      .then(r => r.json())
      .then(d => setEntries(Array.isArray(d) ? d : []))
      .catch(() => toast.error("Failed to load audit log"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = entries.filter(e => filter === "all" || e.action === filter);

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-on-surface tracking-tight">Audit Log</h1>
          <p className="text-sm text-secondary mt-0.5">Last 100 admin actions</p>
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

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTER_OPTIONS.map(f => (
          <button
            type="button"
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === f.value
                ? "bg-primary/10 text-primary"
                : "bg-white border border-black/6 text-secondary hover:bg-surface-container shadow-sm"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && entries.length === 0 ? (
        <div className="flex items-center justify-center py-32">
          <span className="material-symbols-outlined text-[48px] text-secondary animate-spin">progress_activity</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-secondary text-sm">No entries found</div>
      ) : (
        /* Timeline */
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-[19px] top-5 bottom-5 w-px bg-black/6" />

          <div className="space-y-3">
            {filtered.map(entry => {
              const style = ACTION_STYLES[entry.action] ?? {
                label:     entry.action,
                icon:      "info",
                iconClass: "bg-surface-container text-secondary",
                badge:     "bg-surface-container text-secondary",
              };
              return (
                <div key={entry.id} className="relative flex gap-4 items-start">
                  {/* Icon dot */}
                  <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.iconClass}`}>
                    <span className="material-symbols-outlined text-[18px] icon-fill">{style.icon}</span>
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-white border border-black/6 rounded-2xl p-4 shadow-sm min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${style.badge}`}>
                          {style.label}
                        </span>
                        {(entry.target_name || entry.target_type === "platform") && (
                          <span className="text-xs font-semibold text-on-surface">
                            {entry.target_name ?? "Platform"}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-secondary whitespace-nowrap">
                        {formatRelativeTime(entry.created_at)}
                      </p>
                    </div>

                    <p className="text-sm text-secondary font-mono truncate">{summarise(entry)}</p>

                    <p className="text-[11px] text-secondary mt-1.5">
                      by <span className="font-semibold text-on-surface">{entry.performed_by}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
