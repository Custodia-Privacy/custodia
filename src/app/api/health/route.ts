/**
 * Load balancer / probe endpoint. Does not require auth.
 *
 * Contract:
 *  - 200 if database is reachable. Redis status is reported in the body
 *    but does NOT flip us to 503; the app can still serve most routes
 *    (landing, auth, quick-scan is inline) with Redis down. Background
 *    scans and agent workers will fail until Redis comes back.
 *  - 503 if Postgres is unreachable — app is non-functional.
 *
 * Uptime / alerting should page on `redis: "down"` even when overall ok.
 */
import { NextResponse } from "next/server";
import IORedis from "ioredis";
import { db } from "@/lib/db";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

// Reuse a single connection across health-check invocations so we don't
// leak sockets on every probe. Lazy so module load never crashes when
// Redis is temporarily down at boot.
const globalForHealth = globalThis as unknown as {
  healthRedis: IORedis | undefined;
};

function getHealthRedis(): IORedis {
  if (globalForHealth.healthRedis) return globalForHealth.healthRedis;
  // Keep lazyConnect so module load never crashes when Redis is cold.
  // Leave offline queue enabled — ping() needs to wait for the socket
  // to open on first call. Outer Promise.race bounds total time.
  const client = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    connectTimeout: 2000,
  });
  client.on("error", () => {
    // Swallow — the ping() caller handles the rejection. Without this
    // listener ioredis prints to stderr on every disconnect, spamming logs.
  });
  globalForHealth.healthRedis = client;
  return client;
}

async function checkDb(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function checkRedis(): Promise<boolean> {
  try {
    const client = getHealthRedis();
    // With lazyConnect, the first ping triggers a connect attempt. If the
    // client is already "ready" (singleton cached), ping() just returns PONG.
    const pong = await Promise.race([
      client.ping(),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("redis ping timeout")), 2000),
      ),
    ]);
    return pong === "PONG";
  } catch {
    return false;
  }
}

export async function GET() {
  const [dbOk, redisOk] = await Promise.all([checkDb(), checkRedis()]);

  return NextResponse.json(
    {
      ok: dbOk,
      service: "custodia",
      database: dbOk ? "up" : "down",
      redis: redisOk ? "up" : "down",
      timestamp: new Date().toISOString(),
    },
    { status: dbOk ? 200 : 503 },
  );
}
