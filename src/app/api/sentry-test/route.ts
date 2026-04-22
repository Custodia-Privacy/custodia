import { NextResponse, type NextRequest } from "next/server";

/**
 * Sentry smoke-test endpoint. Throws on purpose so you can verify Sentry
 * captures server errors end-to-end after wiring the DSN.
 *
 * Protected two ways:
 *  1. Only responds when NODE_ENV !== "production" OR a matching secret is
 *     passed via ?secret=... (value of CRON_SECRET, which already exists).
 *  2. Returns 404 otherwise so it's not discoverable.
 *
 * Usage:
 *   GET /api/sentry-test              (dev only)
 *   GET /api/sentry-test?secret=XXX   (prod, where XXX === CRON_SECRET)
 *
 * DELETE this route after you've verified Sentry is receiving events.
 */
export async function GET(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";
  const secret = req.nextUrl.searchParams.get("secret");
  const authorized = isDev || (secret && secret === process.env.CRON_SECRET);

  if (!authorized) {
    return new NextResponse("Not Found", { status: 404 });
  }

  throw new Error(
    "Sentry smoke test: if you can see this in Sentry, server-side capture is working.",
  );

  // Unreachable, here only for TS.
  return NextResponse.json({ ok: true });
}
