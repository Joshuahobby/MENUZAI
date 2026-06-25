"use client";

import { useState } from "react";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useLivePricing } from "@/hooks/useLivePricing";

const PRO_FEATURES = [
  "AI Digital Waiter — answers questions, takes orders 24/7",
  "Unlimited menus & categories",
  "Real-time orders dashboard",
  "Staff roles & permissions",
  "Live analytics — 90-day history",
  "AI review reply generator",
  "Gallery photos per menu item",
  "Custom branded QR posters",
];

interface TrialExpiredModalProps {
  restaurantId: string;
  onDismiss: () => void;
}

export default function TrialExpiredModal({ restaurantId, onDismiss }: TrialExpiredModalProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const pricingPlans = useLivePricing();

  const MONTHLY_PRO = pricingPlans.find(p => p.name === "Pro")?.amountRwf ?? 35_000;
  const ANNUAL_PRO = MONTHLY_PRO * 11;

  const price = isAnnual ? ANNUAL_PRO : MONTHLY_PRO;
  const planName = `Pro (${isAnnual ? "Annual" : "Monthly"})`;
  const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n);

  const handleContinueFree = () => {
    localStorage.setItem(`trial-choice-made-${restaurantId}`, "1");
    onDismiss();
  };

  const handleUpgradeSuccess = () => {
    localStorage.setItem(`trial-choice-made-${restaurantId}`, "1");
    setCheckoutOpen(false);
    onDismiss();
  };

  return (
    <>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div className="bg-surface-container-lowest rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-linear-to-tr from-primary to-primary-container p-8 text-white text-center">
            <span className="material-symbols-outlined text-[40px] mb-3 block opacity-90">experiment</span>
            <h2 className="text-2xl font-headline font-black tracking-tight mb-2">
              Your 14-day trial has ended
            </h2>
            <p className="text-white/80 text-sm">
              Choose how you&apos;d like to continue with MENUZA AI
            </p>
          </div>

          {/* Plans */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pro card */}
            <div className="bg-on-surface rounded-2xl p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-3 right-3 bg-primary-container/20 text-primary-container text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full">
                Recommended
              </div>

              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50 mb-1">Pro Plan</p>
              <p className="text-sm text-white/70 mb-4">Everything you need to grow</p>

              {/* Billing toggle */}
              <div className="flex items-center bg-white/10 rounded-xl p-1 mb-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIsAnnual(false)}
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${!isAnnual ? "bg-surface-container-lowest text-on-surface shadow" : "text-white/60 hover:text-white"}`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnnual(true)}
                  className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${isAnnual ? "bg-surface-container-lowest text-on-surface shadow" : "text-white/60 hover:text-white"}`}
                >
                  Annual
                  <span className={`text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full ${isAnnual ? "bg-primary/20 text-primary" : "bg-white/10 text-white/50"}`}>
                    1 mo free
                  </span>
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white tracking-tight">{fmt(price)}</span>
                  <span className="text-sm font-bold text-white/50 ml-1">RWF</span>
                </div>
                <p className="text-[11px] text-white/50 mt-0.5">
                  {isAnnual ? `per year — save ${fmt(MONTHLY_PRO)} RWF` : "per month"}
                </p>
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[11px] text-white/75 leading-snug">
                    <span className="material-symbols-outlined text-[13px] text-primary-container mt-0.5 shrink-0">check</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Money-back badge */}
              <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-2 mb-4">
                <span className="material-symbols-outlined text-[14px] text-primary-container">verified</span>
                <span className="text-[10px] text-white/70">
                  <strong className="text-white">14-day money-back guarantee.</strong> Full refund, no questions asked.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setCheckoutOpen(true)}
                className="w-full py-3 bg-linear-to-tr from-primary to-primary-container text-white font-bold rounded-xl text-sm shadow-lg shadow-primary/30 hover:bg-[#a04100] active:scale-95 transition-colors"
              >
                Upgrade to Pro
              </button>
            </div>

            {/* Free Lite card */}
            <div className="bg-surface-container rounded-2xl p-6 flex flex-col">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-secondary/60 mb-1">Free Lite</p>
              <p className="text-sm text-secondary mb-4">Basic menu hosting</p>

              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tight">0</span>
                  <span className="text-sm font-bold text-secondary ml-1">RWF</span>
                </div>
                <p className="text-[11px] text-secondary/60 mt-0.5">free forever</p>
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {[
                  "1 published menu",
                  "QR code generation",
                  "WhatsApp ordering",
                  "Basic menu editor",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[11px] text-secondary leading-snug">
                    <span className="material-symbols-outlined text-[13px] text-tertiary mt-0.5 shrink-0">check</span>
                    {f}
                  </li>
                ))}
                {[
                  "No AI Digital Waiter",
                  "No real-time orders dashboard",
                  "No analytics",
                  '"Powered by MENUZA AI" on your menu',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[11px] text-secondary/50 leading-snug">
                    <span className="material-symbols-outlined text-[13px] text-secondary/30 mt-0.5 shrink-0">remove</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={handleContinueFree}
                className="w-full py-3 bg-surface-container-high text-secondary font-bold rounded-xl text-sm hover:bg-surface-container-highest transition-colors"
              >
                Continue with Free Lite
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-secondary/40 pb-5">
            You can upgrade to Pro at any time from your dashboard settings.
          </p>
        </div>
      </div>

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        planName={planName}
        priceAmount={price}
        onSuccess={handleUpgradeSuccess}
      />
    </>
  );
}
