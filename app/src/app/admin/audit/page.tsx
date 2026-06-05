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

const ACTION_STYLES: Record<string, { label: string; className: string; icon: string }> = {
  plan_override:    { label: "Plan Override",    className: "bg-amber-500/10 text-amber-700",  icon: "swap_horiz"    },
  ai_config_change: { label: "AI Config Change", className: "bg-blue-500/10 text-blue-700",    icon: "robot_2"       },
};

function summarise(entry: AuditEntry): string {
  if (entry.action === "plan_override") {
    const oldPlan = (entry.old_value?.plan as string) ?? "?";
    const newPlan = (entry.new_value?.plan as string) ?? "?";
    const days = entry.new_value?.expiryDays as number | null;
    return `${oldPlan} → ${newPlan}${days ? ` (${days}d)` : ""}`;
  }
  if (entry.action === "ai_config_change") {
    const oldP = (entry.old_value?.provider as string) ?? "?";
    const newP = (entry.new_value?.provider as string) ?? "?";
    const newM = (entry.new_value?.model as string) ?? "";
    return `${oldP} → ${newP} · ${newM}`;
  }
  return "—";
}

export default function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/audit-log")
      .then((r) => r.json())
      .then((d) => setEntries(Array.isArray(d) ? d : []))
      .catch(() => toast.error("Failed to load audit log"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = entries.filter(
    (e) => filter === "all" || e.action === filter
  );

  return (
    <div className="p-6 lg:p-10 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">Audit Log</h1>
          <p className="text-sm text-secondary">Last 100 admin actions</p>
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

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        {[
          { value: "all",              label: "All" },
          { value: "plan_override",    label: "Plan Overrides" },
          { value: "ai_config_change", label: "Config Changes" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === f.value
                ? "bg-primary/10 text-primary"
                : "bg-surface-container text-secondary hover:bg-surface-container-high"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading && entries.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <span className="material-symbols-outlined text-[48px] text-secondary animate-spin">progress_activity</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-secondary text-sm">No entries found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const style = ACTION_STYLES[entry.action] ?? {
              label: entry.action,
              className: "bg-surface-container text-secondary",
              icon: "info",
            };
            return (
              <div
                key={entry.id}
                className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 flex gap-4"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.className}`}>
                  <span className="material-symbols-outlined text-[18px] icon-fill">{style.icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${style.className}`}>
                      {style.label}
                    </span>
                    {entry.target_name && (
                      <span className="text-xs font-semibold text-on-surface truncate">
                        {entry.target_name}
                      </span>
                    )}
                    {entry.target_type === "platform" && (
                      <span className="text-xs font-semibold text-on-surface">Platform</span>
                    )}
                  </div>

                  <p className="text-sm text-secondary font-mono truncate">{summarise(entry)}</p>

                  <p className="text-[11px] text-secondary mt-1.5">
                    by <span className="font-semibold text-on-surface">{entry.performed_by}</span>
                    {" · "}
                    {formatRelativeTime(entry.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
