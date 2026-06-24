"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ServicePagerProps {
  restaurantId: string;
  resolvedTableNumber: string;
  onOrderTableNumberChange: (val: string) => void;
}

export default function ServicePager({
  restaurantId,
  resolvedTableNumber,
  onOrderTableNumberChange,
}: ServicePagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [serviceType, setServiceType] = useState<"call_waiter" | "bill" | "water" | "custom">("call_waiter");
  const [serviceMessage, setServiceMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [localTableInput, setLocalTableInput] = useState("");
  const lastSentAt = useRef(0);

  const COOLDOWN_MS = 5000;

  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => setSent(false), 2500);
    return () => clearTimeout(t);
  }, [sent]);

  useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown(false), COOLDOWN_MS);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const table = localTableInput.trim();
    if (!table) {
      toast.error("Please enter your table number first.");
      return;
    }
    const now = Date.now();
    if (now - lastSentAt.current < COOLDOWN_MS) {
      toast.error("Please wait a moment before sending another request.");
      return;
    }
    setIsSending(true);
    onOrderTableNumberChange(table);

    const channel = supabase.channel(`table_requests:${restaurantId}`);
    const finish = (success: boolean) => {
      supabase.removeChannel(channel);
      if (success) {
        toast.success("Assistance request sent to staff! 🛎️");
        lastSentAt.current = Date.now();
        setCooldown(true);
        setSent(true);
        setIsOpen(false);
        setServiceMessage("");
      } else {
        toast.error("Failed to connect to waiter service.");
      }
      setIsSending(false);
    };

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "new_request",
          payload: {
            id: crypto.randomUUID(),
            tableNumber: table,
            type: serviceType,
            message: serviceMessage.trim(),
            created_at: new Date().toISOString(),
            status: "pending",
          },
        }).then(() => finish(true)).catch(() => finish(false));
      } else if (status === "CHANNEL_ERROR" || status === "CLOSED" || status === "TIMED_OUT") {
        finish(false);
      }
    });
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => { setLocalTableInput(resolvedTableNumber); setIsOpen(true); }}
        className={`fixed bottom-56 right-6 w-14 h-14 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all cursor-pointer ${
          sent
            ? "bg-emerald-500 scale-110 animate-service-pulse"
            : "bg-gradient-to-tr from-amber-500 to-amber-600 animate-bounce-slow"
        }`}
        title={sent ? "Sent!" : "Call Waiter / Request Service"}
        aria-label={sent ? "Service request sent" : "Call Waiter / Request Service"}
      >
        <span className={`material-symbols-outlined text-2xl font-bold transition-all ${!sent && "icon-fill"}`}>
          {sent ? "check_circle" : "concierge"}
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-surface w-full max-w-md sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500">
            <div className="bg-gradient-to-tr from-amber-500 to-amber-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl icon-fill font-bold">concierge</span>
                </div>
                <div>
                  <h4 className="font-[var(--font-headline)] font-bold text-sm">Table Assistance</h4>
                  <p className="text-[10px] opacity-80 uppercase tracking-widest font-black">Table {localTableInput || resolvedTableNumber || "—"}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
                title="Close pager"
                aria-label="Close service pager"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <form onSubmit={handleSend} className="p-6 space-y-6">
              <div>
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-3 block">What do you need?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "call_waiter", name: "Call Waiter", icon: "concierge", sub: "Request assistance" },
                    { id: "bill", name: "Request Bill", icon: "payments", sub: "Ready to pay" },
                    { id: "water", name: "Need Water", icon: "local_drinking_water", sub: "Bring water" },
                    { id: "custom", name: "Custom Call", icon: "chat_bubble", sub: "Type request" },
                  ].map((opt) => {
                    const isSelected = serviceType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setServiceType(opt.id as "call_waiter" | "bill" | "water" | "custom")}
                        className={`flex flex-col p-4 rounded-2xl border text-left transition-all cursor-pointer ${isSelected ? "border-amber-500 bg-amber-500/5 text-amber-600 ring-2 ring-amber-500/10 font-bold" : "border-outline-variant/15 hover:bg-surface-container-low text-secondary"}`}
                      >
                        <span className="material-symbols-outlined text-xl mb-2">{opt.icon}</span>
                        <span className="text-xs font-bold block">{opt.name}</span>
                        <span className="text-[9px] opacity-75 font-normal block mt-0.5">{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 block" htmlFor="service-table">Your Table Number</label>
                <input
                  id="service-table"
                  type="text"
                  value={localTableInput}
                  onChange={(e) => setLocalTableInput(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 block" htmlFor="service-message">Additional details (Optional)</label>
                <textarea
                  id="service-message"
                  rows={3}
                  value={serviceMessage}
                  onChange={(e) => setServiceMessage(e.target.value)}
                  placeholder={serviceType === "custom" ? "Type details here, e.g. Extra napkins, clean glass, fork..." : "Any extra details..."}
                  className="w-full bg-surface-container-low border-none rounded-2xl py-3 px-4 text-xs font-semibold focus:ring-2 focus:ring-amber-500/20 leading-relaxed custom-scrollbar resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-4 bg-gradient-to-tr from-amber-500 to-amber-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-amber-500/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSending ? "Sending Request..." : "Send Call Alert"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
