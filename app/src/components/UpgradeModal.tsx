"use client";

import { useState, useCallback, createContext, useContext, useRef } from "react";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useMenu } from "@/context/MenuContext";

interface UpgradeModalOptions {
  feature?: string;
  description?: string;
}

interface UpgradeContextType {
  showUpgrade: (opts?: UpgradeModalOptions) => void;
}

const UpgradeContext = createContext<UpgradeContextType>({ showUpgrade: () => {} });

export function useUpgrade() {
  return useContext(UpgradeContext);
}

const PRO_FEATURES = [
  { icon: "robot_2",       label: "AI Digital Waiter" },
  { icon: "star",          label: "AI Review Replies" },
  { icon: "photo_library", label: "Gallery uploads" },
  { icon: "group",         label: "Staff management" },
  { icon: "restaurant_menu", label: "Unlimited menus" },
  { icon: "analytics",     label: "Live analytics (90 days)" },
  { icon: "qr_code_2",     label: "Premium QR templates" },
];

export function UpgradeProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<UpgradeModalOptions>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { setPlan } = useMenu();

  const showUpgrade = useCallback((options?: UpgradeModalOptions) => {
    setOpts(options ?? {});
    setOpen(true);
  }, []);

  return (
    <UpgradeContext.Provider value={{ showUpgrade }}>
      {children}

      {open && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-[2rem] w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary to-primary-container p-8 pb-6">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
              <span className="material-symbols-outlined text-white text-[40px] mb-3 block">workspace_premium</span>
              <h2 className="text-2xl font-[var(--font-headline)] font-black text-white tracking-tight">
                {opts.feature ? `${opts.feature} requires Pro` : "Upgrade to Pro"}
              </h2>
              {opts.description && (
                <p className="text-white/80 text-sm mt-2">{opts.description}</p>
              )}
            </div>

            {/* Features */}
            <div className="p-6">
              <p className="text-xs font-bold uppercase text-secondary tracking-widest mb-4">Everything in Pro</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {PRO_FEATURES.map((f) => (
                  <div key={f.label} className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-primary text-[18px]">{f.icon}</span>
                    <span className="font-medium">{f.label}</span>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="bg-surface-container rounded-2xl p-4 mb-5 flex items-center justify-between">
                <div>
                  <p className="font-black text-xl">35,000 RWF</p>
                  <p className="text-xs text-secondary">per month · cancel anytime</p>
                </div>
                <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full">MTN MoMo / Airtel</span>
              </div>

              <button
                type="button"
                onClick={() => { setOpen(false); setCheckoutOpen(true); }}
                className="w-full py-4 bg-gradient-to-tr from-primary to-primary-container text-white font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">send_to_mobile</span>
                Upgrade with Mobile Money
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full py-3 text-secondary text-sm mt-2 hover:text-on-surface transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        planName="Pro"
        priceAmount={35000}
        onSuccess={(newPlan) => {
          setPlan(newPlan);
          setCheckoutOpen(false);
        }}
      />
    </UpgradeContext.Provider>
  );
}
