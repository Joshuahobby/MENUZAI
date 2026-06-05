"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PROVIDER_DEFAULTS } from "@/lib/ai-config";
import { useRouter } from "next/navigation";

type Provider = "openrouter" | "anthropic";

interface ApiKeys {
  openrouter: boolean;
  anthropic: boolean;
}

export default function PlatformAdminSettings() {
  const router = useRouter();

  const [provider, setProvider] = useState<Provider>("openrouter");
  const [model, setModel] = useState(PROVIDER_DEFAULTS.openrouter);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeys | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }

      Promise.all([
        fetch("/api/admin/ai-config").then((r) => r.json()),
        fetch("/api/admin/health").then((r) => r.json()),
      ])
        .then(([config, keys]) => {
          if (config.provider) setProvider(config.provider as Provider);
          if (config.model) setModel(config.model);
          if (config.updated_at) setUpdatedAt(config.updated_at);
          if (!keys.error) setApiKeys(keys as ApiKeys);
        })
        .catch((err) => console.error("Failed to load admin config", err))
        .finally(() => setLoading(false));
    });
  }, [router]);

  const handleProviderChange = (next: Provider) => {
    setProvider(next);
    setModel(PROVIDER_DEFAULTS[next]);
  };

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
        setUpdatedAt(data.updated_at ?? new Date().toISOString());
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

  const KeyBadge = ({ ok, label }: { ok: boolean; label: string }) => (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
        ok ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-500"
      }`}
    >
      <span className="material-symbols-outlined text-[12px]">{ok ? "check_circle" : "cancel"}</span>
      {label}
    </span>
  );

  return (
    <div className="min-h-screen bg-surface p-6 lg:p-10 pb-32">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-[var(--font-headline)] font-extrabold tracking-tight text-on-surface mb-1">
            AI Provider
          </h1>
          <p className="text-sm text-secondary">Configure the global AI stack for all MENUZAI features.</p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-surface-container rounded-xl w-full" />
            <div className="h-48 bg-surface-container rounded-xl w-full" />
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-surface-container p-8 rounded-[2rem] shadow-sm space-y-6">
            <h2 className="font-[var(--font-headline)] font-bold text-base text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">robot_2</span>
              Global AI Provider
            </h2>

            {/* API key health */}
            {apiKeys && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-widest">API Keys</span>
                <KeyBadge ok={apiKeys.openrouter} label="OpenRouter" />
                <KeyBadge ok={apiKeys.anthropic} label="Anthropic" />
              </div>
            )}

            {/* Provider selection */}
            <div>
              <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-3 block">
                Active Provider
              </label>
              <div className={`grid grid-cols-2 gap-4 ${saving ? "opacity-50 pointer-events-none" : ""}`}>
                {(["openrouter", "anthropic"] as Provider[]).map((p) => (
                  <label
                    key={p}
                    className={`border-2 p-4 rounded-xl cursor-pointer transition-all ${
                      provider === p
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-surface-container bg-surface hover:bg-surface-container-low text-on-surface"
                    }`}
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={p}
                      checked={provider === p}
                      onChange={() => handleProviderChange(p)}
                      className="hidden"
                    />
                    <div className="font-bold mb-1 text-sm">
                      {p === "openrouter" ? "OpenRouter (Free Tier)" : "Anthropic (Claude)"}
                    </div>
                    <p className="text-xs opacity-80 font-medium">
                      {p === "openrouter"
                        ? "Default fallback. Uses Llama / Gemma models."
                        : "Premium tier. Uses Claude 3.5 Sonnet."}
                    </p>
                    {apiKeys && !apiKeys[p] && (
                      <p className="text-[10px] text-amber-500 font-bold mt-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">warning</span>
                        No API key configured
                      </p>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Model string */}
            <div>
              <label className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-3 block">
                Model String
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={saving}
                className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface font-medium disabled:opacity-50"
                placeholder={PROVIDER_DEFAULTS[provider]}
              />
              <p className="text-xs text-secondary mt-2">
                Must match the chosen provider&apos;s API model ID.
              </p>
            </div>

            {/* Save */}
            <div className="pt-4 border-t border-surface-container space-y-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-gradient-to-br from-primary to-primary-container rounded-xl font-bold text-sm text-white shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Configuration"}
              </button>
              {updatedAt && (
                <p className="text-center text-[11px] text-secondary">
                  Last saved: {new Date(updatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
