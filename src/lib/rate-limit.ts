/**
 * Redis-backed sliding window rate limiter.
 *
 * Uses sorted sets for precise sliding window counting.
 * Falls back to in-memory if Redis is unavailable.
 */
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const globalForRedis = globalThis as unknown as { rateLimitRedis: IORedis | undefined };

function getRedis(): IORedis {
  if (!globalForRedis.rateLimitRedis) {
    globalForRedis.rateLimitRedis = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    globalForRedis.rateLimitRedis.connect().catch(() => {});
  }
  return globalForRedis.rateLimitRedis;
}

const memoryFallback = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
  resetAt: number;
}

/**
 * Check rate limit for a key within a sliding window.
 *
 * @param key   Unique identifier (e.g. "api:cust_abc123" or "login:192.168.1.1")
 * @param max   Maximum requests allowed in the window
 * @param windowMs   Window duration in milliseconds
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    const redis = getRedis();
    if (redis.status !== "ready") throw new Error("Redis not ready");

    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    pipeline.zadd(redisKey, now.toString(), `${now}:${Math.random()}`);
    pipeline.zcard(redisKey);
    pipeline.pexpire(redisKey, windowMs);
    const results = await pipeline.exec();

    const count = (results?.[2]?.[1] as number) ?? 0;
    const remaining = Math.max(0, max - count);
    const resetAt = now + windowMs;

    if (count > max) {
      return {
        ok: false,
        limit: max,
        remaining: 0,
        retryAfterSec: Math.ceil(windowMs / 1000),
        resetAt,
      };
    }

    return { ok: true, limit: max, remaining, retryAfterSec: 0, resetAt };
  } catch {
    return checkMemoryRateLimit(key, max, windowMs);
  }
}

function checkMemoryRateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const b = memoryFallback.get(key);

  if (!b || now > b.resetAt) {
    memoryFallback.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, limit: max, remaining: max - 1, retryAfterSec: 0, resetAt: now + windowMs };
  }

  b.count += 1;
  if (b.count > max) {
    const retryAfterSec = Math.ceil((b.resetAt - now) / 1000);
    return { ok: false, limit: max, remaining: 0, retryAfterSec, resetAt: b.resetAt };
  }

  return { ok: true, limit: max, remaining: max - b.count, retryAfterSec: 0, resetAt: b.resetAt };
}

/**
 * Attach rate limit headers to a Response or NextResponse.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.ok ? {} : { "Retry-After": String(result.retryAfterSec) }),
  };
}
