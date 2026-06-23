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

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  reset: number;
}

/**
 * Checks rate limit and returns whether the request is allowed,
 * plus remaining quota info. Falls back to allowing (true) if Redis
 * is unavailable — never hard-fails.
 */
export async function checkRateLimit(
  key: string,
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  const limiter = getLimiter(opts);
  if (!limiter) {
    console.warn(`rate-limit: Redis unavailable, rejecting requests for "${opts.id}"`);
    return { allowed: false, remaining: 0, limit: opts.max, reset: Date.now() + opts.windowMs };
  }
  try {
    const { success, remaining, limit, reset } = await limiter.limit(key);
    return { allowed: success, remaining, limit, reset };
  } catch (err) {
    console.error(`rate-limit: Redis error for "${opts.id}":`, err);
    return { allowed: false, remaining: 0, limit: opts.max, reset: Date.now() + opts.windowMs };
  }
}

export async function checkRateLimitBool(
  key: string,
  opts: RateLimitOptions
): Promise<boolean> {
  const { allowed } = await checkRateLimit(key, opts);
  return allowed;
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
