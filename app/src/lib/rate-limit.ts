import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy singleton — reused across warm invocations on the same Vercel instance.
// Fails gracefully if KV env vars aren't set (never throws on import).
let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (_redis) return _redis;
  try {
    _redis = Redis.fromEnv();
    return _redis;
  } catch {
    return null;
  }
}

// Cache Ratelimit instances by config string — avoids rebuilding on every request.
const _limiters = new Map<string, Ratelimit>();

export interface RateLimitOptions {
  /** Unique name for this limiter (used as Redis key prefix) */
  id: string;
  /** Max requests allowed in the window */
  max: number;
  /** Window length in milliseconds */
  windowMs: number;
}

function getLimiter(opts: RateLimitOptions): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const cacheKey = `${opts.id}:${opts.max}:${opts.windowMs}`;
  if (!_limiters.has(cacheKey)) {
    // Convert ms to whole seconds for Upstash Duration string
    const secs = Math.max(1, Math.round(opts.windowMs / 1000));
    _limiters.set(
      cacheKey,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(opts.max, `${secs} s`),
        prefix: `rl:${opts.id}`,
      })
    );
  }
  return _limiters.get(cacheKey)!;
}

/**
 * Returns true if the request is within the rate limit, false if exceeded.
 * Falls back to allowing (true) if Redis is unavailable — never hard-fails.
 */
export async function checkRateLimit(
  key: string,
  opts: RateLimitOptions
): Promise<boolean> {
  const limiter = getLimiter(opts);
  if (!limiter) {
    console.warn(`rate-limit: Redis unavailable, rejecting requests for "${opts.id}"`);
    return false;
  }
  try {
    const { success } = await limiter.limit(key);
    return success;
    } catch (err) {
      console.error(`rate-limit: Redis error for "${opts.id}":`, err);
      return false; // fail‑closed on Redis errors
    }
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
