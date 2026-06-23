"use client";

import { Suspense, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type View = "auth" | "confirm-email" | "forgot-password" | "reset-sent";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("auth");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");
  const [isSignUp, setIsSignUp] = useState(() => searchParams.get("signup") === "true");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding` },
      });
      if (error) { setError(error.message); }
      else if (data.session) { router.push("/onboarding"); }
      else { setView("confirm-email"); }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); }
      else if (data.session) {
        // Always go to dashboard — the dashboard layout reads onboarded from
        // MenuContext and redirects to /onboarding automatically if needed.
        router.push("/dashboard");
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setView("reset-sent");
  };

  // ── Email confirmation screen ─────────────────────────────────────────────
  if (view === "confirm-email") {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-sm border border-black/6 text-center space-y-6">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-2xl text-emerald-500">mark_email_unread</span>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
          <p className="text-secondary text-sm leading-relaxed">
            We sent a confirmation link to <span className="font-semibold text-on-surface">{email}</span>.
            Click it to activate your account.
          </p>
        </div>
        <button type="button" onClick={() => setView("auth")} className="text-sm font-semibold text-secondary hover:text-primary transition-colors">
          Back to sign in
        </button>
      </div>
    );
  }

  // ── Password reset sent screen ────────────────────────────────────────────
  if (view === "reset-sent") {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-sm border border-black/6 text-center space-y-6">
        <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-2xl text-violet-500">lock_reset</span>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">Reset link sent</h2>
          <p className="text-secondary text-sm leading-relaxed">
            We emailed a password reset link to{" "}
            <span className="font-semibold text-on-surface">{email}</span>.
            Check your inbox and follow the link to set a new password.
          </p>
        </div>
        <p className="text-xs text-secondary/50">Didn&apos;t receive it? Check your spam folder or{" "}
          <button type="button" onClick={() => { setView("forgot-password"); setError(null); }} className="text-primary font-semibold hover:underline">
            try again
          </button>.
        </p>
        <button type="button" onClick={() => { setView("auth"); setError(null); }} className="text-sm font-semibold text-secondary hover:text-primary transition-colors">
          Back to sign in
        </button>
      </div>
    );
  }

  // ── Forgot password screen ────────────────────────────────────────────────
  if (view === "forgot-password") {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-sm border border-black/6 space-y-6">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <span className="material-symbols-outlined text-white icon-fill text-base">restaurant_menu</span>
            </div>
            <span className="font-[var(--font-headline)] font-black text-base tracking-tight">
              MENUZA <span className="text-primary">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Forgot your password?</h1>
          <p className="text-secondary text-sm">Enter your email and we&apos;ll send you a reset link.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/60 block mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@restaurant.com"
              className="w-full px-4 py-3 bg-[#faf8f6] rounded-xl border border-black/8 text-sm font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => { setView("auth"); setError(null); }}
            className="text-sm text-secondary hover:text-primary transition-colors flex items-center gap-1 mx-auto"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  // ── Google OAuth redirect in-progress ────────────────────────────────────
  if (oauthLoading) {
    return (
      <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-sm border border-black/6 text-center space-y-6">
        <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-7 h-7 animate-spin" style={{ animationDuration: "1.5s" }}>
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">Redirecting to Google…</h2>
          <p className="text-secondary text-sm">You&apos;ll be brought back here automatically after signing in.</p>
        </div>
      </div>
    );
  }

  // ── Main auth form ────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-10 shadow-sm border border-black/6">
      {/* Brand */}
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="material-symbols-outlined text-white icon-fill text-base">restaurant_menu</span>
          </div>
          <span className="font-[var(--font-headline)] font-black text-base tracking-tight">
            MENUZA <span className="text-primary">AI</span>
          </span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-secondary text-sm">
          {isSignUp ? "Start building your digital menu today." : "Sign in to your dashboard."}
        </p>
      </div>

      {(error || callbackError) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-medium rounded-xl">
          {error ?? "Confirmation failed — please try again."}
        </div>
      )}

      {/* Google OAuth */}
      <button
        type="button"
        onClick={async () => {
          setOauthLoading(true);
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/api/auth/callback` },
          });
          if (error) { setError(error.message); setOauthLoading(false); }
          // On success the browser redirects — oauthLoading stays true showing the redirect screen
        }}
        disabled={loading || oauthLoading}
        className="w-full py-3.5 bg-white border border-black/10 text-on-surface font-semibold text-sm rounded-xl hover:bg-black/2 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
        Continue with Google
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-black/6" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-[10px] uppercase tracking-[0.2em] font-bold text-secondary/40">or</span>
        </div>
      </div>

      {!showEmailForm ? (
        <button
          type="button"
          onClick={() => setShowEmailForm(true)}
          className="w-full py-3.5 border border-black/10 text-on-surface font-semibold text-sm rounded-xl hover:bg-black/2 transition-colors flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined text-lg text-secondary">mail</span>
          Continue with Email
        </button>
      ) : (
        <>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/60 block mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@restaurant.com"
                className="w-full px-4 py-3 bg-[#faf8f6] rounded-xl border border-black/8 text-sm font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/60">Password</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => { setView("forgot-password"); setError(null); }}
                    className="text-[10px] font-bold text-secondary/60 hover:text-primary transition-colors uppercase tracking-widest"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 bg-[#faf8f6] rounded-xl border border-black/8 text-sm font-medium placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/50 hover:text-secondary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Please wait…" : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setShowPassword(false); }}
              className="text-sm text-secondary hover:text-primary transition-colors"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const PROOF_POINTS = [
  { icon: "qr_code_2",      text: "QR menu live in under 5 minutes" },
  { icon: "support_agent",  text: "AI waiter takes orders while you sleep" },
  { icon: "analytics",      text: "See which dishes drive revenue" },
  { icon: "translate",      text: "Works in English, French, Kinyarwanda" },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#faf8f6] flex">
      {/* Left panel — product value (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-on-surface p-12">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="material-symbols-outlined text-white icon-fill text-base">restaurant_menu</span>
          </div>
          <span className="font-[var(--font-headline)] font-black text-base tracking-tight text-white">
            MENUZA <span className="text-primary">AI</span>
          </span>
        </Link>

        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-primary/70 mb-6">
            Used by restaurants across Africa
          </p>
          <h2 className="text-3xl font-[var(--font-headline)] font-black text-white leading-tight mb-10">
            Your menu. Smarter.<br />From day one.
          </h2>
          <ul className="space-y-5">
            {PROOF_POINTS.map(({ icon, text }) => (
              <li key={icon} className="flex items-center gap-4">
                <div className="w-9 h-9 bg-white/8 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
                </div>
                <span className="text-white/70 text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <blockquote className="border-l-2 border-primary/40 pl-5">
          <p className="text-white/60 text-sm leading-relaxed italic">
            &ldquo;We set up our digital menu in one evening. Orders through WhatsApp started the next morning.&rdquo;
          </p>
          <p className="text-white/40 text-xs mt-2 font-semibold">— Restaurant owner, Kigali</p>
        </blockquote>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col w-full max-w-md gap-3">
          {/* Mobile-only back link — desktop has the left panel for context */}
          <Link href="/" className="lg:hidden flex items-center gap-1 text-xs font-semibold text-secondary hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Back to site
          </Link>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
