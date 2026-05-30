import { createServerClient } from "@supabase/ssr";

// Cookie-free Supabase client for public, unauthenticated reads.
// Using this (instead of createSupabaseServerClient) allows Next.js ISR to
// cache the response — the SSR client calls cookies() which opts out of caching.
let _client: ReturnType<typeof createServerClient> | null = null;

export function getSupabasePublicClient() {
  if (!_client) {
    _client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
  }
  return _client;
}
