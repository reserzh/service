/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-server deployments.
 * Replace with @upstash/ratelimit + Redis for multi-server setups.
 */

interface RateLimitEntry {
  timestamps: number[];
  windowMs: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds to prevent memory leaks
const CLEANUP_INTERVAL = 60_000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < entry.windowMs);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  // Allow Node.js to exit even if the timer is running
  if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

interface RateLimitConfig {
  /** Maximum number of requests in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

/**
 * Check if a request is allowed under the rate limit.
 * @param key - Unique identifier (e.g., IP address or user ID)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed and metadata
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  ensureCleanup();

  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [], windowMs: config.windowMs };

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const resetMs = oldestInWindow + config.windowMs - now;
    return { allowed: false, remaining: 0, resetMs };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetMs: config.windowMs,
  };
}

/** Pre-configured rate limits for different endpoint types */
export const RATE_LIMITS = {
  /** Auth endpoints: 5 requests per minute per IP */
  auth: { maxRequests: 5, windowMs: 60_000 },
  /** Public form submissions: 10 requests per minute per IP */
  publicForm: { maxRequests: 10, windowMs: 60_000 },
  /** General API: 100 requests per minute per user/IP */
  api: { maxRequests: 100, windowMs: 60_000 },
} as const;
