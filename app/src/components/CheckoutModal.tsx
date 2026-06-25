"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  priceAmount: number;
  onSuccess?: (plan: string) => void;
}

type PaymentStage = "form" | "awaiting" | "confirmed" | "failed";

const POLL_INTERVAL_MS = 3_000;
const POLL_MAX_ATTEMPTS = 40; // 2 minutes

export function CheckoutModal({ isOpen, onClose, planName, priceAmount, onSuccess }: CheckoutModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<PaymentStage>("form");
  const [depositId, setDepositId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      setStage("form");
      setPhoneNumber("");
      setDepositId(null);
      attemptsRef.current = 0;
    }
  }, [isOpen]);

  useEffect(() => {
    if (stage !== "awaiting" || !depositId) return;

    pollRef.current = setInterval(async () => {
      attemptsRef.current += 1;
      if (attemptsRef.current > POLL_MAX_ATTEMPTS) {
        clearInterval(pollRef.current!);
        return;
      }

      try {
        const res = await fetch(`/api/payments/status?depositId=${depositId}`);
        if (!res.ok) return;
        const { status, plan } = await res.json();

        if (status === "completed") {
          clearInterval(pollRef.current!);
          setStage("confirmed");
          onSuccess?.(plan ?? planName.toLowerCase());
        } else if (status === "failed") {
          clearInterval(pollRef.current!);
          setStage("failed");
        }
      } catch {
        // network blip — keep polling
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current!);
  }, [stage, depositId, planName, onSuccess]);

  if (!isOpen) return null;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return toast.error("Please enter a valid mobile money number.");

    setLoading(true);
    try {
      const res = await fetch("/api/payments/pawapay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: `250${phoneNumber.replace(/^0+/, "")}`,
          plan: planName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      setDepositId(data.depositId);
      setStage("awaiting");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-container-lowest rounded-[2rem] w-full max-w-md shadow-2xl p-8 relative animate-in fade-in zoom-in-95 duration-200">
        {stage !== "confirmed" && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-secondary hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}

        {stage === "confirmed" && (
          <div className="flex flex-col items-center text-center py-4">
            <span className="material-symbols-outlined text-[64px] text-tertiary mb-4">check_circle</span>
            <h2 className="text-2xl font-headline font-black tracking-tight mb-2">You&apos;re on {planName}!</h2>
            <p className="text-secondary text-sm mb-8 leading-relaxed">
              Payment confirmed. Your plan has been upgraded — enjoy all the new features.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-tertiary text-white font-bold rounded-xl text-sm hover:bg-tertiary/90 transition-colors"
            >
              Close
            </button>
          </div>
        )}

        {stage === "failed" && (
          <div className="flex flex-col items-center text-center py-4">
            <span className="material-symbols-outlined text-[64px] text-error mb-4">cancel</span>
            <h2 className="text-2xl font-headline font-black tracking-tight mb-2">Payment failed</h2>
            <p className="text-secondary text-sm mb-8 leading-relaxed">
              The payment was not completed. Please check your Mobile Money balance and try again.
            </p>
            <button
              type="button"
              onClick={() => setStage("form")}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl text-sm hover:bg-[#a04100] transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {stage === "awaiting" && (
          <div className="flex flex-col items-center text-center py-4">
            <span className="material-symbols-outlined text-[56px] text-primary mb-4 animate-pulse">smartphone</span>
            <h2 className="text-2xl font-headline font-black tracking-tight mb-3">Check your phone</h2>
            <p className="text-secondary text-sm mb-6 leading-relaxed">
              A Mobile Money prompt has been sent to{" "}
              <span className="font-bold text-on-surface">250{phoneNumber.replace(/^0+/, "")}</span>.
              Enter your PIN to complete the payment.
            </p>
            <div className="flex items-center gap-2 text-xs text-secondary mb-8 bg-surface-container p-3 rounded-xl w-full justify-center">
              <span className="w-3 h-3 rounded-full bg-primary animate-ping inline-block shrink-0"></span>
              Waiting for confirmation…
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-primary/10 text-primary font-bold rounded-xl text-sm hover:bg-primary/20 transition-colors"
            >
              I&apos;ll check back later
            </button>
          </div>
        )}

        {stage === "form" && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-headline font-black tracking-tight mb-2">Checkout</h2>
              <p className="text-secondary text-sm">
                You are upgrading to the <span className="font-bold text-primary">{planName}</span> plan.
              </p>
            </div>

            <div className="flex justify-between items-center bg-surface-container p-4 rounded-xl mb-6 border border-outline-variant/20">
              <span className="font-bold">Total Due:</span>
              <span className="text-xl font-black">
                {priceAmount.toLocaleString()} RWF / {planName.includes("Annual") ? "year" : "month"}
              </span>
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
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-3 pl-14 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-medium"
                    required
                  />
                </div>
                <p className="text-xs text-secondary mt-2">Enter your MTN MoMo or Airtel Money number.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-linear-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary-container/20 active:scale-95 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
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

            <div className="mt-4 flex items-center gap-2 text-xs bg-surface-container rounded-xl p-3">
              <span className="material-symbols-outlined text-[16px] text-tertiary shrink-0">verified</span>
              <span className="text-secondary">
                <strong className="text-on-surface">14-day money-back guarantee.</strong>{" "}
                Not happy? Full refund, no questions asked.
              </span>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-secondary font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Secured by pawaPay
            </div>
          </>
        )}
      </div>
    </div>
  );
}
