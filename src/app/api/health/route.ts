/**
 * Load balancer / probe endpoint. Does not require auth.
 * Returns 503 if the database cannot be reached.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      service: "custodia",
      database: "up",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        service: "custodia",
        database: "down",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
