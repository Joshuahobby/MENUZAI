"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { isPlatformAdmin } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

export default function PlatformAdminSettings() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [provider, setProvider] = useState<"openrouter" | "anthropic">("openrouter");
  const [model, setModel] = useState("meta-llama/llama-3.2-11b-vision-instruct:free");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      const authorized = isPlatformAdmin(user.email);
      setIsAuthorized(authorized);
      setAuthChecking(false);

      if (authorized) {
        fetch("/api/admin/ai-config")
          .then((res) => res.json())
          .then((data) => {
            if (data.provider) setProvider(data.provider);
            if (data.model) setModel(data.model);
            setLoading(false);
          })
          .catch((err) => {
            console.error("Failed to load AI config", err);
            setLoading(false);
          });
      }
    });
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("AI stack configuration updated");
      } else {
        throw new Error(data.error || "Failed to save configuration");
      }
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-8">
        <div className="animate-pulse space-y-4 w-full max-w-md">
          <div className="h-12 bg-surface-container rounded-2xl w-2/3 mx-auto"></div>
          <div className="h-32 bg-surface-container rounded-2xl w-full"></div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface">
        <div className="w-full max-w-md bg-surface-container-lowest border border-surface-container-high/50 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
          {/* Decorative Gradient Blurs */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-error/5 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>

          {/* Secure Shield Warning Icon */}
          <div className="w-20 h-20 rounded-3xl bg-error/10 text-error flex items-center justify-center mb-6 shadow-inner relative">
            <span className="material-symbols-outlined text-4xl icon-fill">gpp_maybe</span>
          </div>

          <h2 className="text-2xl font-[var(--font-headline)] font-extrabold tracking-tight mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-secondary mb-6 max-w-sm leading-relaxed">
            You are signed in as <strong className="text-on-surface">{user?.email}</strong>, but this zone is reserved for Platform Administrators.
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 bg-gradient-to-br from-primary to-primary-container rounded-xl font-bold text-sm text-white shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
            >
              Return to Dashboard
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="w-full py-3 bg-surface-container-high hover:bg-error/10 hover:text-error rounded-xl font-bold text-sm text-secondary transition-all active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-8 pb-32">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight text-on-surface">
            Platform Admin
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/admin/metrics")}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">bar_chart</span>
              Metrics
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-secondary bg-surface-container-high hover:bg-surface-container-highest rounded-xl transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">dashboard</span>
              Dashboard
            </button>
          </div>
        </div>
        <p className="text-secondary mb-10">Configure the underlying AI provider stack for MENUZAI.</p>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-surface-container rounded-xl w-full"></div>
            <div className="h-48 bg-surface-container rounded-xl w-full"></div>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-surface-container p-8 rounded-[2rem] shadow-sm">
            <h2 className="font-[var(--font-headline)] font-bold text-lg mb-6 text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">robot_2</span>
              Global AI Provider
            </h2>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-3 block">
                  Active Provider
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label
                    className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${
                      provider === "openrouter"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-surface-container bg-surface hover:bg-surface-container-low text-on-surface"
                    }`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value="openrouter"
                      checked={provider === "openrouter"}
                      onChange={() => setProvider("openrouter")}
                      className="hidden"
                    />
                    <div className="font-bold mb-1">OpenRouter (Free Tier)</div>
                    <p className="text-xs opacity-80 font-medium">Default fallback. Uses Gemma/Qwen models.</p>
                  </label>

                  <label
                    className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${
                      provider === "anthropic"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-surface-container bg-surface hover:bg-surface-container-low text-on-surface"
                    }`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value="anthropic"
                      checked={provider === "anthropic"}
                      onChange={() => setProvider("anthropic")}
                      className="hidden"
                    />
                    <div className="font-bold mb-1">Anthropic (Claude)</div>
                    <p className="text-xs opacity-80 font-medium">Premium tier. Uses Claude 3.5 Sonnet.</p>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-3 block">
                  Model String
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
                  placeholder="e.g. meta-llama/llama-3.2-11b-vision-instruct:free or claude-3-5-sonnet-20241022"
                />
                <p className="text-xs text-secondary mt-2">
                  Must match the provider API expectations.
                </p>
              </div>

              <div className="pt-6 border-t border-surface-container">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-br from-primary to-primary-container rounded-xl font-bold text-sm text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-60"
                >
                  {saving ? "Saving Configuration..." : "Save Configuration"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

