import type { ConnectionOptions } from "bullmq";

/** Parse REDIS_URL for BullMQ / ioredis (password URL-decoded). */
export function parseRedisConnection(rawUrl: string): ConnectionOptions {
  const u = new URL(rawUrl);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 6379,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    username: u.username ? decodeURIComponent(u.username) : undefined,
    maxRetriesPerRequest: null,
  };
}
