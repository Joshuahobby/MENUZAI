"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function MenuError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <span className="material-symbols-outlined text-error text-5xl mb-6 block">no_meals</span>
        <h2 className="text-2xl font-extrabold mb-3">Menu unavailable</h2>
        <p className="text-secondary mb-8 leading-relaxed text-sm">
          This menu could not be loaded. It may have been removed or there was a temporary error.
        </p>
        <div className="flex flex-col gap-4">
          <button
            onClick={reset}
            className="w-full py-3 bg-primary-container text-white font-bold rounded-xl active:scale-95 transition-all text-sm"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full py-3 bg-surface-container-highest text-on-surface font-bold rounded-xl hover:bg-surface-variant transition-all text-sm"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
