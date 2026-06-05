"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import type { RestaurantRow } from "@/app/api/admin/restaurants/route";

const SEGMENTS = [
  { value: "all",      label: "All Users",      desc: "Every restaurant on the platform" },
  { value: "trial",    label: "On Trial",        desc: "Free plan with active trial period" },
  { value: "free",     label: "Free (no trial)", desc: "Free plan, trial ended or never started" },
  { value: "pro",      label: "Pro",             desc: "Active Pro subscribers" },
  { value: "business", label: "Business",        desc: "Active Business subscribers" },
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
    const confirmed = window.confirm(`Send to ~${count} recipient${count !== 1 ? "s" : ""}?\n\nSubject: ${subject}\nSegment: ${segment}`);
    if (!confirmed) return;

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

  return (
    <div className="p-6 lg:p-10 pb-24 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-[var(--font-headline)] font-extrabold tracking-tight mb-1">Broadcast Email</h1>
        <p className="text-sm text-secondary">Send a message to a segment of your users via Resend.</p>
      </div>

      <div className="space-y-6">
        {/* Segment picker */}
        <div className="bg-surface-container-lowest border border-surface-container/50 rounded-3xl p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-4">Audience Segment</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SEGMENTS.map(s => {
              const count = loadingRestaurants ? null : estimateCount(s.value);
              const isActive = segment === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setSegment(s.value)}
                  className={`flex items-start justify-between gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-surface-container hover:border-primary/30"
                  }`}
                >
                  <div>
                    <p className={`text-sm font-bold ${isActive ? "text-primary" : "text-on-surface"}`}>{s.label}</p>
                    <p className="text-[11px] text-secondary mt-0.5">{s.desc}</p>
                  </div>
                  {count !== null && (
                    <span className={`text-lg font-extrabold font-mono shrink-0 ${isActive ? "text-primary" : "text-secondary"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Compose */}
        <div className="bg-surface-container-lowest border border-surface-container/50 rounded-3xl p-6 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2">Compose</p>
          <div>
            <label className="text-xs font-bold text-secondary mb-1.5 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Important update from MENUZA AI"
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-secondary mb-1.5 block">
              HTML Body <span className="font-normal normal-case text-secondary">(raw HTML sent via Resend)</span>
            </label>
            <textarea
              value={html}
              onChange={e => setHtml(e.target.value)}
              rows={12}
              placeholder={'<div style="font-family:sans-serif">\n  <h1>Hello!</h1>\n  <p>Your message here.</p>\n</div>'}
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border-none focus:ring-2 focus:ring-primary/20 font-mono resize-y"
            />
          </div>
        </div>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={sending || !subject.trim() || !html.trim()}
          className="w-full py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50"
        >
          {sending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              Sending…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[16px]">send</span>
              Send to ~{loadingRestaurants ? "…" : estimateCount(segment)} recipient{estimateCount(segment) !== 1 ? "s" : ""}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
