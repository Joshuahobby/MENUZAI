"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto bg-error/10 rounded-2xl flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-error text-3xl">edit_off</span>
        </div>
        <h2 className="text-xl font-headline font-extrabold mb-2">Editor crashed</h2>
        <p className="text-secondary text-sm mb-2 leading-relaxed">
          Something went wrong loading the menu editor.
        </p>
        <p className="text-secondary/60 text-xs mb-8">
          Your menu is saved automatically — no work has been lost.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary text-white font-bold rounded-[2rem] text-sm hover:bg-[#a04100] transition-colors active:scale-95"
          >
            Reload Editor
          </button>
          <Link
            href="/dashboard/menus"
            className="px-6 py-3 bg-surface-container-highest text-on-surface font-bold rounded-xl text-sm hover:bg-surface-variant transition-colors"
          >
            My Menus
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-surface-container text-secondary font-bold rounded-xl text-sm hover:bg-surface-container-high transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
