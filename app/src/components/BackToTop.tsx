"use client";

import { useState, useEffect } from "react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-8 right-6 z-50 w-11 h-11 rounded-full bg-on-surface text-surface flex items-center justify-center shadow-lg hover:opacity-80 active:scale-95 transition-colors duration-300 cursor-pointer ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
    </button>
  );
}
