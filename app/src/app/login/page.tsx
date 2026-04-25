"use client";

import { Suspense, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackError = searchParams.get("error");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.session) {
        router.push("/onboarding");
      } else {
        setConfirmationSent(true);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
      }
    }

    setLoading(false);
  };

  if (confirmationSent) {
    return (
      <div className="w-full max-w-md bg-surface-container-lowest rounded-[2.5rem] p-10 shadow-2xl border border-outline-variant/10 relative z-10 text-center space-y-6">
        <div className="w-16 h-16 bg-tertiary/10 rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl text-tertiary">mark_email_unread</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-on-surface mb-2">Check your inbox</h2>
          <p className="text-secondary text-sm">
            We sent a confirmation link to <span className="font-bold text-on-surface">{email}</span>.
            Click it to activate your account and you&apos;ll be taken straight to setup.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmationSent(false)}
          className="text-sm font-bold text-secondary hover:text-primary transition-colors"
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-surface-container-lowest rounded-[2.5rem] p-10 shadow-2xl border border-outline-variant/10 relative z-10 transition-all duration-500">
      <div className="text-center mb-10">
        <Link href="/" className="text-3xl font-[var(--font-headline)] font-black tracking-tighter text-primary-container mb-2 inline-block">
          MENUZA AI
        </Link>
        <h2 className="text-xl font-bold text-on-surface mb-2">{isSignUp ? "Create your account" : "Welcome back"}</h2>
        <p className="text-secondary text-sm">Join the next generation of digital menus</p>
      </div>

      {(error || callbackError) && (
        <div className="mb-6 p-4 bg-error-container/20 border border-error/20 text-error text-xs font-bold rounded-2xl flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          {error ?? "Confirmation failed — please try again."}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-secondary ml-4">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@restaurant.com"
            className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border border-transparent focus:border-primary/30 outline-none transition-all font-medium text-sm"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-secondary ml-4">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-6 py-4 bg-surface-container-low rounded-2xl border border-transparent focus:border-primary/30 outline-none transition-all font-medium text-sm"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:translate-y-0"
        >
          {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
        </button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-outline-variant/30"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
          <span className="bg-surface-container-lowest px-4 text-secondary">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={async () => {
          setLoading(true);
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/api/auth/callback`,
            },
          });
          if (error) {
            setError(error.message);
            setLoading(false);
          }
        }}
        disabled={loading}
        className="w-full py-4 bg-surface-container border border-outline-variant/40 hover:border-primary/40 text-on-surface font-bold rounded-2xl hover:bg-surface-container-high active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
        Google
      </button>

      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
          className="text-sm font-bold text-secondary hover:text-primary transition-colors"
        >
          {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 -right-20 w-80 h-80 bg-tertiary/10 rounded-full blur-[100px]" />
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
