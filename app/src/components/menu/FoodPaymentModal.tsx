"use client";

import { useState, useEffect, useRef } from "react";
import type { CartItem } from "@/types/menu";
import { toast } from "sonner";

interface Props {
  restaurantId: string;
  menuId: string;
  items: CartItem[];
  total: number;
  currency: string;
  tableNumber?: string | null;
  customerName?: string | null;
  onSuccess: (orderId?: string) => void;
  onClose: () => void;
}

type PaymentState = "idle" | "initiating" | "polling" | "success" | "failed" | "timeout";

export default function FoodPaymentModal({ restaurantId, menuId, items, total, currency, tableNumber, customerName, onSuccess, onClose }: Props) {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<PaymentState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const orderIdRef = useRef<string | null>(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  useEffect(() => () => stopPolling(), []);

  const handleInitiate = async () => {
    const cleaned = phone.trim().replace(/[\s\-().]/g, "");
    if (!cleaned) { setErrorMsg("Please enter your phone number."); return; }

    setState("initiating");
    setErrorMsg("");

    try {
      const res = await fetch("/api/payments/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, menuId, items, total, currency, phone: cleaned, tableNumber: tableNumber ?? null, customerName: customerName ?? null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment initiation failed");

      if (data.error) throw new Error(data.error);

      orderIdRef.current = data.orderId || null;
      setState("polling");

      // Poll for payment status every 3 seconds, timeout after 2 minutes
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/payments/status?depositId=${data.depositId}`);
          const statusData = await statusRes.json();
          if (statusData.status === "completed") {
            stopPolling();
            setState("success");
            onSuccess(orderIdRef.current ?? undefined);
          } else if (statusData.status === "failed") {
            stopPolling();
            setState("failed");
            setErrorMsg("Payment was declined. Please try again.");
          }
        } catch {
          stopPolling();
          setState("failed");
          setErrorMsg("Payment check failed due to a network error. Please contact the restaurant.");
        }
      }, 3000);

      timeoutRef.current = setTimeout(() => {
        stopPolling();
        setState((prev) => {
          if (prev === "polling") {
            setErrorMsg("Payment timed out. Please try again.");
            return "timeout";
          }
          return prev;
        });
      }, 120_000);

    } catch (err: unknown) {
      setState("failed");
      setErrorMsg((err as Error).message || "Something went wrong. Please try again.");
    }
  };

  const handleRetry = () => {
    stopPolling();
    setState("idle");
    setErrorMsg("");
  };

  const handleCancelOrder = async () => {
    const id = orderIdRef.current;
    if (!id) { onClose(); return; }
    try {
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Cancel order failed:", data.error || res.statusText);
      }
    } catch (err) {
      console.error("Cancel order network error:", err);
    }
    toast.success("Your order has been cancelled.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-surface-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-[var(--font-headline)] font-extrabold text-lg text-on-surface">Pay with Mobile Money</h2>
            <p className="text-sm text-secondary mt-0.5">MTN MoMo or Airtel Money</p>
          </div>
          <button onClick={onClose} disabled={state === "polling" || state === "initiating"} className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:bg-surface-container-high transition-all disabled:opacity-40">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Amount */}
        <div className="bg-surface-container-low rounded-2xl p-4 mb-6 text-center">
          <p className="text-xs text-secondary font-semibold mb-1">Total to pay</p>
          <p className="text-3xl font-extrabold text-primary font-mono">{total.toLocaleString()} {currency}</p>
          <p className="text-xs text-secondary mt-1">{items.length} item{items.length !== 1 ? "s" : ""}</p>
        </div>

        {(state === "idle" || state === "failed" || state === "timeout") && (
          <>
            <div className="mb-6">
              <label className="text-xs font-bold text-secondary uppercase tracking-widest mb-2 block">
                Your Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+250 788 000 000"
                className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-sm text-on-surface border-none focus:ring-2 focus:ring-primary/20 disabled:opacity-40"
                autoFocus
                disabled={state !== "idle"}
                onKeyDown={e => { if (e.key === "Enter") handleInitiate(); }}
              />
              {errorMsg && <p className="text-xs text-error mt-2">{errorMsg}</p>}
            </div>
            {state === "idle" ? (
              <button
                onClick={handleInitiate}
                className="w-full py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
              >
                Pay Now
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleRetry}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-br from-primary to-primary-container text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  className="w-full py-3 rounded-2xl text-sm font-bold border border-error/30 text-error bg-transparent hover:bg-error/5 transition-all"
                >
                  Cancel Order
                </button>
              </div>
            )}
          </>
        )}

        {state === "initiating" && (
          <div className="text-center py-4">
            <span className="material-symbols-outlined text-[40px] text-primary animate-spin block mb-3">progress_activity</span>
            <p className="font-semibold">Initiating payment…</p>
          </div>
        )}

        {state === "polling" && (
          <div className="text-center py-4">
            <span className="material-symbols-outlined text-[40px] text-primary animate-pulse block mb-3">smartphone</span>
            <p className="font-bold text-base mb-1">Check your phone</p>
            <p className="text-sm text-secondary">A MoMo prompt has been sent to <span className="font-semibold text-on-surface">{phone}</span>. Approve it to complete payment.</p>
            <p className="text-xs text-secondary mt-4 animate-pulse">Waiting for confirmation…</p>
          </div>
        )}

        {state === "success" && (
          <div className="text-center py-4">
            <span className="material-symbols-outlined text-[48px] text-tertiary icon-fill block mb-3">check_circle</span>
            <p className="font-extrabold text-lg mb-1">Payment successful!</p>
            <p className="text-sm text-secondary">Your order has been placed and payment confirmed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
