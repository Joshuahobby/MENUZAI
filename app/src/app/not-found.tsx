import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#faf8f6] flex flex-col items-center justify-center p-6 text-center">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-16">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined text-white icon-fill text-lg">restaurant_menu</span>
        </div>
        <span className="font-[var(--font-headline)] font-black text-base tracking-tight">
          MENUZA <span className="text-primary">AI</span>
        </span>
      </Link>

      {/* 404 */}
      <p className="text-[120px] lg:text-[160px] font-black font-[var(--font-headline)] leading-none text-black/6 select-none mb-0">
        404
      </p>

      {/* Icon */}
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center -mt-6 mb-6">
        <span className="material-symbols-outlined text-primary text-[32px] icon-fill">search_off</span>
      </div>

      {/* Message */}
      <h1 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">
        Page not found
      </h1>
      <p className="text-secondary text-sm max-w-sm leading-relaxed mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Let&apos;s get you back on track.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          Back to Home
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-white border border-black/8 text-on-surface text-sm font-bold rounded-xl hover:bg-surface-container shadow-sm transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
