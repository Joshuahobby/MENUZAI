"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "pwa-install-dismissed";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed or installed
    if (localStorage.getItem(STORAGE_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 30 seconds to avoid interrupting the user immediately
      setTimeout(() => setVisible(true), 30_000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    setVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-surface-container-lowest border border-surface-container shadow-2xl rounded-[2rem] p-5 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
          <span className="material-symbols-outlined text-white text-2xl icon-fill">restaurant_menu</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-on-surface">Install MENUZA AI</p>
          <p className="text-xs text-secondary mt-0.5">Faster access, works offline</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high text-secondary transition-colors"
            aria-label="Dismiss"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all active:scale-95"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
