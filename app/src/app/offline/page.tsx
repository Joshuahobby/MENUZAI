"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-primary text-4xl">wifi_off</span>
        </div>
        <h1 className="text-2xl font-headline font-extrabold mb-3">You&apos;re offline</h1>
        <p className="text-secondary leading-relaxed mb-8">
          Check your connection and try again. Your menu edits are saved and will sync when you&apos;re back online.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-primary-container text-white font-bold rounded-[2rem] hover:bg-[#a04100] transition-colors active:scale-95"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
