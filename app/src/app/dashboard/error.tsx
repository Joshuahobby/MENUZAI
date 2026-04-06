"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-6 lg:p-12 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full text-center">
        <span className="material-symbols-outlined text-error text-5xl mb-6 block">sentiment_very_dissatisfied</span>
        <h2 className="text-2xl font-extrabold mb-3">Dashboard error</h2>
        <p className="text-secondary mb-8 leading-relaxed text-sm">
          Something went wrong loading this page.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary-container text-white font-bold rounded-xl active:scale-95 transition-all text-sm"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-surface-container-highest text-on-surface font-bold rounded-xl hover:bg-surface-variant transition-all text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
