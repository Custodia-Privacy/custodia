import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const globalForCache = globalThis as unknown as { cacheRedis: IORedis | undefined };

const redis =
  globalForCache.cacheRedis ??
  new IORedis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForCache.cacheRedis = redis;
}

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    // Redis down — fall through to direct query
  }
  const result = await fn();
  try {
    await redis.set(key, JSON.stringify(result), "EX", ttlSeconds);
  } catch {
    // Redis down — continue without caching
  }
  return result;
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // Redis down — ignore
  }
}
