"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function SWRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("ServiceWorker registration failed:", err);
    });

    // Show a reload toast when a new SW version takes control
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      toast("App updated — reload to get the latest.", {
        duration: Infinity,
        action: {
          label: "Reload",
          onClick: () => window.location.reload(),
        },
      });
    });
  }, []);

  return null;
}
