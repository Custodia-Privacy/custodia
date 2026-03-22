/**
 * NextAuth.js v5 route handler.
 * Handles all auth routes: /api/auth/signin, /api/auth/callback, etc.
 */

// TODO: Initialize NextAuth with providers once dependencies are installed
// import { handlers } from "@/lib/auth";
// export const { GET, POST } = handlers;

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Auth not yet configured" });
}

export async function POST() {
  return NextResponse.json({ message: "Auth not yet configured" });
}
