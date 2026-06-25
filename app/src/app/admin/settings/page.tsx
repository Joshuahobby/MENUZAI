"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PROVIDER_DEFAULTS } from "@/lib/ai-config";

type Provider = "openrouter" | "anthropic";

interface ApiKeys {
  openrouter: boolean;
  anthropic: boolean;
}

export default function PlatformAdminSettings() {
  const [provider, setProvider] = useState<Provider>("openrouter");
  const [model, setModel] = useState(PROVIDER_DEFAULTS.openrouter);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeys | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/ai-config").then(r => r.json()),
      fetch("/api/admin/health").then(r => r.json()),
    ])
      .then(([config, keys]) => {
        if (config.provider) setProvider(config.provider as Provider);
        if (config.model) setModel(config.model);
        if (config.updated_at) setUpdatedAt(config.updated_at);
        if (!keys.error && typeof keys.openrouter === "boolean") setApiKeys(keys as ApiKeys);
      })
      .catch(err => console.error("Failed to load admin config", err))
      .finally(() => setLoading(false));
  }, []);

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

  const PROVIDERS: { value: Provider; label: string; desc: string; icon: string }[] = [
    {
      value: "openrouter",
      label: "OpenRouter",
      desc: "Default free tier. Uses Llama / Gemma open models.",
      icon: "hub",
    },
    {
      value: "anthropic",
      label: "Anthropic (Claude)",
      desc: "Premium tier. Uses Claude Sonnet for higher accuracy.",
      icon: "smart_toy",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-on-surface tracking-tight">AI Settings</h1>
        <p className="text-sm text-secondary mt-0.5">Configure the global AI provider for all MENUZA AI features.</p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-surface-container-lowest border border-black/6 rounded-2xl" />
          <div className="h-40 bg-surface-container-lowest border border-black/6 rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* API key health */}
          {apiKeys && (
            <div className="bg-surface-container-lowest border border-black/6 rounded-2xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3">API Key Status</p>
              <div className="flex gap-3 flex-wrap">
                {([["openrouter", "OpenRouter"], ["anthropic", "Anthropic"]] as const).map(([key, label]) => (
                  <div
                    key={key}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                      apiKeys[key]
                        ? "bg-tertiary/10 text-tertiary"
                        : "bg-error/10 text-error"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {apiKeys[key] ? "check_circle" : "cancel"}
                    </span>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Provider selector */}
          <div className="bg-surface-container-lowest border border-black/6 rounded-2xl p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-4">Active Provider</p>
            <div className={`grid grid-cols-2 gap-3 ${saving ? "opacity-50 pointer-events-none" : ""}`}>
              {PROVIDERS.map(p => (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => handleProviderChange(p.value)}
                  className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-colors ${
                    provider === p.value
                      ? "border-primary bg-primary/5"
                      : "border-black/8 hover:border-primary/30"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    provider === p.value ? "bg-primary/10" : "bg-surface-container"
                  }`}>
                    <span className={`material-symbols-outlined text-[17px] icon-fill ${
                      provider === p.value ? "text-primary" : "text-secondary"
                    }`}>
                      {p.icon}
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${provider === p.value ? "text-primary" : "text-on-surface"}`}>
                      {p.label}
                    </p>
                    <p className="text-[11px] text-secondary mt-0.5">{p.desc}</p>
                  </div>
                  {apiKeys && !apiKeys[p.value] && (
                    <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">warning</span>
                      No API key set
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Model string */}
          <div className="bg-surface-container-lowest border border-black/6 rounded-2xl p-5">
            <label htmlFor="model-string" className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-3 block">
              Model String
            </label>
            <input
              id="model-string"
              type="text"
              value={model}
              onChange={e => setModel(e.target.value)}
              disabled={saving}
              placeholder={PROVIDER_DEFAULTS[provider]}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium disabled:opacity-50"
            />
            <p className="text-xs text-secondary mt-2">
              Must match the chosen provider&apos;s API model ID exactly.
            </p>
          </div>

          {/* Save */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-primary rounded-[2rem] font-bold text-sm text-white hover:bg-[#a04100] transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Configuration"}
          </button>

          {updatedAt && (
            <p className="text-center text-[11px] text-secondary">
              Last saved: {new Date(updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
