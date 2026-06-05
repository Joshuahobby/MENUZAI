import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const DEFAULT_PROVIDER = "openrouter";
export const DEFAULT_MODEL = "meta-llama/llama-3.2-11b-vision-instruct:free";

export const PROVIDER_DEFAULTS: Record<"openrouter" | "anthropic", string> = {
  openrouter: "meta-llama/llama-3.2-11b-vision-instruct:free",
  anthropic: "claude-3-5-sonnet-20241022",
};

// Per-container in-process cache — avoids a DB round-trip on every AI request.
// TTL is 60 s; the setting changes rarely and staleness is acceptable.
let _cache: { provider: string; model: string; expiresAt: number } | null = null;

export async function getPlatformAIConfig(): Promise<{ provider: string; model: string }> {
  if (_cache && Date.now() < _cache.expiresAt) {
    return { provider: _cache.provider, model: _cache.model };
  }
  try {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data } = await admin
        .from("platform_settings")
        .select("ai_provider, ai_model")
        .eq("id", "global")
        .single();
      if (data?.ai_provider) {
        const result = {
          provider: data.ai_provider as string,
          model: (data.ai_model as string) || DEFAULT_MODEL,
        };
        _cache = { ...result, expiresAt: Date.now() + 60_000 };
        return result;
      }
    }
  } catch (e) {
    console.warn("getPlatformAIConfig: could not fetch platform_settings, using defaults", e);
  }
  return { provider: DEFAULT_PROVIDER, model: DEFAULT_MODEL };
}
