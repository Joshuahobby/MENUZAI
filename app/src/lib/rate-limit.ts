// In-memory rate limiter — per-instance only (acceptable for abuse deterrence;
// does not coordinate across Vercel serverless instances).
// For distributed enforcement, replace the store with Upstash Redis.

interface Entry { count: number; resetAt: number }

const stores = new Map<string, Map<string, Entry>>();

function getStore(key: string): Map<string, Entry> {
  let store = stores.get(key);
  if (!store) { store = new Map(); stores.set(key, store); }
  return store;
}

export interface RateLimitOptions {
  /** Unique name for this limiter (e.g. "extract-menu") */
  id: string;
  /** Max requests allowed per window */
  max: number;
  /** Window length in milliseconds */
  windowMs: number;
}

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 * Pass the client IP as `key`.
 */
export function checkRateLimit(key: string, opts: RateLimitOptions): boolean {
  const store = getStore(opts.id);
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return true;
  }
  if (entry.count >= opts.max) return false;
  entry.count += 1;
  return true;
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
