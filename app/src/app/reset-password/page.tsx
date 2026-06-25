"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<"checking" | "ready" | "done">("checking");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error: err }) => {
      if (err || !data.user) {
        setError("This password reset link is invalid or has expired. Please request a new one.");
        setState("ready");
      } else {
        setState("ready");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) { setError("Enter a new password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: password.trim() });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setState("done");
      setTimeout(() => router.push("/dashboard"), 3000);
    }
  };

  if (state === "checking") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-10 shadow-sm border border-black/6 text-center space-y-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-secondary">Verifying your reset link…</p>
        </div>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-10 shadow-sm border border-black/6 text-center space-y-6">
          <div className="w-14 h-14 bg-tertiary/10 rounded-2xl flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-2xl text-tertiary">check_circle</span>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Password updated</h2>
            <p className="text-secondary text-sm leading-relaxed">
              Your password has been changed successfully. Redirecting to your dashboard…
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-block py-3.5 px-8 bg-primary text-white font-bold text-sm rounded-[2rem] hover:bg-[#a04100] transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-on-surface p-12">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="material-symbols-outlined text-white icon-fill text-base">restaurant_menu</span>
          </div>
          <span className="font-headline font-black text-base tracking-tight text-white">
            MENUZA <span className="text-primary">AI</span>
          </span>
        </Link>

        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary/70 mb-6">
            Your password. Protected.
          </p>
          <h2 className="text-3xl font-headline font-black text-white leading-tight mb-10">
            Choose a strong<br />new password.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm">
            Your account security matters. Pick something unique that you don&apos;t use on other sites.
          </p>
        </div>

        <blockquote className="border-l-2 border-primary/40 pl-5">
          <p className="text-white/60 text-sm leading-relaxed italic">
            &ldquo;We set up our digital menu in one evening. Orders through WhatsApp started the next morning.&rdquo;
          </p>
          <p className="text-white/40 text-xs mt-2 font-semibold">&mdash; Restaurant owner, Kigali</p>
        </blockquote>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col w-full max-w-md gap-3">
          <Link
            href="/login"
            className="lg:hidden flex items-center gap-1 text-xs font-semibold text-secondary hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Back to login
          </Link>

          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-10 shadow-sm border border-black/6">
            <div className="mb-8">
              <Link href="/" className="hidden lg:flex items-center gap-2 mb-8">
                <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
                  <span className="material-symbols-outlined text-white icon-fill text-base">restaurant_menu</span>
                </div>
                <span className="font-headline font-black text-base tracking-tight">
                  MENUZA <span className="text-primary">AI</span>
                </span>
              </Link>
              <h1 className="text-2xl font-bold tracking-tight mb-1">Set new password</h1>
              <p className="text-secondary text-sm">Choose a strong password for your account.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-error-container/50 border border-error/20 text-error text-xs font-medium rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/60 block mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 bg-surface-container-low rounded-xl border border-black/8 text-sm font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/50 hover:text-secondary transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/60 block mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-black/8 text-sm font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-primary text-white font-bold text-sm rounded-[2rem] hover:bg-[#a04100] transition-colors disabled:opacity-50"
              >
                {loading ? "Updating…" : "Update Password"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-secondary hover:text-primary transition-colors flex items-center gap-1 justify-center"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
