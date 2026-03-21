"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = isSignUp 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 -right-20 w-80 h-80 bg-tertiary/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-md bg-surface-container-lowest rounded-[2.5rem] p-10 shadow-2xl border border-outline-variant/10 relative z-10 transition-all duration-500">
        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-[var(--font-headline)] font-black tracking-tighter text-primary-container mb-2 inline-block">
            MENUZA AI
          </Link>
          <h2 className="text-xl font-bold text-on-surface mb-2">{isSignUp ? "Create your account" : "Welcome back"}</h2>
          <p className="text-secondary text-sm">Join the next generation of digital menus</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-container/20 border border-error/20 text-error text-xs font-bold rounded-2xl flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
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

        <div className="mt-10 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm font-bold text-secondary hover:text-primary transition-colors"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
