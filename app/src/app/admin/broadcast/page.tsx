"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { confirm } from "@/components/Modals";
import type { RestaurantRow } from "@/app/api/admin/restaurants/route";

const SEGMENTS = [
  { value: "all",      label: "All Users",       desc: "Every restaurant on the platform", icon: "groups" },
  { value: "trial",    label: "On Trial",         desc: "Free plan, active trial period",   icon: "hourglass_top" },
  { value: "free",     label: "Free (no trial)",  desc: "Trial ended or never started",     icon: "person" },
  { value: "pro",      label: "Pro",              desc: "Active Pro subscribers",           icon: "workspace_premium" },
  { value: "business", label: "Business",         desc: "Active Business subscribers",      icon: "business" },
] as const;

type Segment = (typeof SEGMENTS)[number]["value"];

export default function AdminBroadcastPage() {
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [segment, setSegment] = useState<Segment>("all");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);

  const loadRestaurants = useCallback(() => {
    setLoadingRestaurants(true);
    fetch("/api/admin/restaurants")
      .then(r => r.json())
      .then(d => setRestaurants(d.restaurants ?? []))
      .catch(() => {})
      .finally(() => setLoadingRestaurants(false));
  }, []);

  useEffect(() => { loadRestaurants(); }, [loadRestaurants]);

  const estimateCount = (seg: Segment) => {
    if (seg === "all") return restaurants.length;
    const now = new Date();
    return restaurants.filter(r => {
      if (seg === "trial") return r.resolvedPlan === "trial";
      if (seg === "free") return r.plan === "free" && (!r.trialEndsAt || new Date(r.trialEndsAt) <= now);
      return r.plan === seg;
    }).length;
  };

  const handleSend = async () => {
    if (!subject.trim()) { toast.error("Subject is required"); return; }
    if (!html.trim()) { toast.error("Email body is required"); return; }
    const count = estimateCount(segment);
    const ok = await confirm({
      title: `Send broadcast to ~${count} recipient${count !== 1 ? "s" : ""}?`,
      message: `Segment: ${SEGMENTS.find(s => s.value === segment)?.label} — Subject: "${subject}". This will send real emails via Resend and cannot be undone.`,
      confirmLabel: "Send",
      danger: true,
    });
    if (!ok) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html, segment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      toast.success(`Sent to ${data.sent} recipient${data.sent !== 1 ? "s" : ""}`);
      setSubject("");
      setHtml("");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const recipientCount = loadingRestaurants ? null : estimateCount(segment);

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-on-surface tracking-tight">Broadcast Email</h1>
        <p className="text-sm text-secondary mt-0.5">Send a message to a segment of your users via Resend.</p>
      </div>

      <div className="lg:grid lg:grid-cols-[280px_1fr] gap-6 space-y-6 lg:space-y-0">
        {/* Left: Audience segment */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3">Audience</p>
          <div className="space-y-2">
            {SEGMENTS.map(s => {
              const count = loadingRestaurants ? null : estimateCount(s.value);
              const isActive = segment === s.value;
              return (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => setSegment(s.value)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-black/8 bg-white hover:border-primary/30 shadow-sm"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-primary/10" : "bg-surface-container"}`}>
                    <span className={`material-symbols-outlined text-[16px] ${isActive ? "text-primary icon-fill" : "text-secondary"}`}>
                      {s.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isActive ? "text-primary" : "text-on-surface"}`}>{s.label}</p>
                    <p className="text-[11px] text-secondary">{s.desc}</p>
                  </div>
                  {count !== null && (
                    <span className={`text-base font-extrabold font-mono shrink-0 ${isActive ? "text-primary" : "text-secondary"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Composer */}
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3">Compose</p>

          <div className="bg-white border border-black/6 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <label htmlFor="broadcast-subject" className="text-xs font-bold text-secondary mb-1.5 block">
                Subject
              </label>
              <input
                id="broadcast-subject"
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Important update from MENUZA AI"
                className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="broadcast-html" className="text-xs font-bold text-secondary mb-1.5 block">
                HTML Body
                <span className="ml-1 font-normal normal-case text-secondary/70">(raw HTML via Resend)</span>
              </label>
              <textarea
                id="broadcast-html"
                value={html}
                onChange={e => setHtml(e.target.value)}
                rows={14}
                placeholder={'<div style="font-family:sans-serif">\n  <h1>Hello!</h1>\n  <p>Your message here.</p>\n</div>'}
                className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border-none focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono resize-y"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !subject.trim() || !html.trim()}
            className="w-full py-3.5 rounded-xl text-sm font-bold bg-primary text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                Sending…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">send</span>
                Send to ~{recipientCount ?? "…"} recipient{recipientCount !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
