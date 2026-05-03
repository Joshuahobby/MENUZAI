"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function PlatformAdminSettings() {
  const [provider, setProvider] = useState<"openrouter" | "anthropic">("openrouter");
  const [model, setModel] = useState("google/gemma-4-31b-it:free");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
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
  }, []);

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

  return (
    <div className="min-h-screen bg-surface p-8 pb-32">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-[var(--font-headline)] font-extrabold tracking-tight mb-2 text-on-surface">
          Platform Admin
        </h1>
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
                  placeholder="e.g. google/gemma-4-31b-it:free or claude-3-5-sonnet-20241022"
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
