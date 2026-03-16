/**
 * Distributed rate limiter using Upstash Redis.
 * Falls back to in-memory sliding-window for local development.
 *
 * Production: Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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

// --- Upstash Redis (production) ---

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const upstashLimiters = new Map<RateLimitConfig, Ratelimit>();

function getUpstashLimiter(config: RateLimitConfig): Ratelimit {
  let limiter = upstashLimiters.get(config);
  if (!limiter) {
    const windowSec = Math.ceil(config.windowMs / 1000);
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${windowSec} s`),
      prefix: "ratelimit",
    });
    upstashLimiters.set(config, limiter);
  }
  return limiter;
}

// --- In-memory fallback (local dev) ---

const memoryStore = new Map<string, number[]>();
const MAX_STORE_SIZE = 10_000;

function checkMemoryRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const timestamps = (memoryStore.get(key) || []).filter(
    (t) => now - t < config.windowMs
  );

  if (timestamps.length >= config.maxRequests) {
    memoryStore.set(key, timestamps);
    const resetMs = timestamps[0] + config.windowMs - now;
    return { allowed: false, remaining: 0, resetMs };
  }

  // Evict all if store grows too large (local dev only, not a concern)
  if (!memoryStore.has(key) && memoryStore.size >= MAX_STORE_SIZE) {
    memoryStore.clear();
  }

  timestamps.push(now);
  memoryStore.set(key, timestamps);

  return {
    allowed: true,
    remaining: config.maxRequests - timestamps.length,
    resetMs: config.windowMs,
  };
}

// --- Public API ---

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (redis) {
    const limiter = getUpstashLimiter(config);
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetMs: Math.max(0, result.reset - Date.now()),
    };
  }
  return checkMemoryRateLimit(key, config);
}

/** Pre-configured rate limits for different endpoint types */
export const RATE_LIMITS = {
  /** Auth endpoints: 5 requests per minute per IP */
  auth: { maxRequests: 5, windowMs: 60_000 },
  /** Public form submissions: 10 requests per minute per IP */
  publicForm: { maxRequests: 10, windowMs: 60_000 },
  /** General API: 100 requests per minute per user/IP */
  api: { maxRequests: 100, windowMs: 60_000 },
  /** Public read endpoints: 30 requests per minute per IP */
  publicRead: { maxRequests: 30, windowMs: 60_000 },
} as const;
