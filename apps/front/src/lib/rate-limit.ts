/**
 * In-memory sliding-window rate limiter for the front app.
 * Used to protect public endpoints (booking, portal invite) from abuse.
 *
 * For production scale, upgrade to Upstash Redis (see apps/back/src/lib/rate-limit.ts).
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

const store = new Map<string, number[]>();
const MAX_STORE_SIZE = 10_000;

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const timestamps = (store.get(key) || []).filter(
    (t) => now - t < config.windowMs
  );

  if (timestamps.length >= config.maxRequests) {
    store.set(key, timestamps);
    const resetMs = timestamps[0] + config.windowMs - now;
    return { allowed: false, remaining: 0, resetMs };
  }

  if (!store.has(key) && store.size >= MAX_STORE_SIZE) {
    store.clear();
  }

  timestamps.push(now);
  store.set(key, timestamps);

  return {
    allowed: true,
    remaining: config.maxRequests - timestamps.length,
    resetMs: config.windowMs,
  };
}

/** Pre-configured rate limits */
export const RATE_LIMITS = {
  /** Booking form submissions: 5 per minute per IP */
  booking: { maxRequests: 5, windowMs: 60_000 },
  /** Portal invite acceptance: 5 per minute per IP */
  portalInvite: { maxRequests: 5, windowMs: 60_000 },
} as const;

/** Extract client IP from request headers */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
