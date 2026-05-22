"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  priceAmount: number;
}

export function CheckoutModal({ isOpen, onClose, planName, priceAmount }: CheckoutModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  if (!isOpen) return null;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return toast.error("Please enter a valid mobile money number.");

    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast.error("Please log in to continue.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/payments/pawapay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: `250${phoneNumber.replace(/^0+/, "")}`,
          plan: planName,
          amount: priceAmount,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAwaitingConfirmation(true);
      } else {
        throw new Error(data.error || "Payment failed");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-[2rem] w-full max-w-md shadow-2xl p-8 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-secondary hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {awaitingConfirmation ? (
          <div className="flex flex-col items-center text-center py-4">
            <span className="material-symbols-outlined text-[56px] text-primary mb-4 animate-pulse">smartphone</span>
            <h2 className="text-2xl font-[var(--font-headline)] font-black tracking-tight mb-3">Check your phone</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              A Mobile Money prompt has been sent to <span className="font-bold text-on-surface">250{phoneNumber.replace(/^0+/, "")}</span>. Enter your PIN to complete the payment.
            </p>
            <p className="text-xs text-secondary mb-8 bg-surface-container p-3 rounded-xl">
              Your <span className="font-bold text-primary">{planName}</span> plan will activate automatically once the payment is confirmed. This usually takes under a minute.
            </p>
            <button
              type="button"
              onClick={() => { onClose(); window.location.reload(); }}
              className="w-full py-3 bg-primary/10 text-primary font-bold rounded-xl text-sm hover:bg-primary/20 transition-colors"
            >
              Done — Refresh Dashboard
            </button>
          </div>
        ) : (
          <>
            {process.env.NEXT_PUBLIC_PAWAPAY_MODE === "sandbox" && (
              <div className="mb-5 flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-xs font-medium">
                <span className="material-symbols-outlined text-[16px] text-amber-500">science</span>
                Test Mode — no real money will be charged
              </div>
            )}
            <div className="mb-8">
              <h2 className="text-2xl font-[var(--font-headline)] font-black tracking-tight mb-2">Checkout</h2>
              <p className="text-secondary text-sm">You are upgrading to the <span className="font-bold text-primary">{planName}</span> plan.</p>
            </div>

            <div className="flex justify-between items-center bg-surface-container p-4 rounded-xl mb-6 border border-outline-variant/20">
              <span className="font-bold">Total Due:</span>
              <span className="text-xl font-black">{priceAmount.toLocaleString()} RWF</span>
            </div>

            <form onSubmit={handlePayment} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Mobile Money Number</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary font-bold">250</span>
                  <input
                    type="tel"
                    placeholder="78XXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 pl-14 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                    required
                  />
                </div>
                <p className="text-xs text-secondary mt-2">Enter your MTN MoMo or Airtel Money number.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary-container/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">send_to_mobile</span>
                    Pay {priceAmount.toLocaleString()} RWF
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-1 text-[10px] text-secondary font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Secured by pawaPay
            </div>
          </>
        )}
      </div>
    </div>
  );
}
