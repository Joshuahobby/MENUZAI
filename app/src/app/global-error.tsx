"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <span className="material-symbols-outlined text-error text-6xl mb-6 block">error</span>
            <h1 className="text-3xl font-extrabold mb-3 text-on-surface">Something went wrong</h1>
            <p className="text-secondary mb-8 leading-relaxed">
              An unexpected error occurred. Our team has been notified.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={reset}
                className="px-8 py-3 bg-primary-container text-white font-bold rounded-xl active:scale-95 transition-all"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="px-8 py-3 bg-surface-container-highest text-on-surface font-bold rounded-xl hover:bg-surface-variant transition-all"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
