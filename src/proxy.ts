/**
 * Next.js 16 Proxy (replaces middleware.ts).
 * Handles auth redirects and request routing.
 *
 * Note: Next.js 16 renamed middleware → proxy, and it runs on Node.js runtime only.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth required
  const publicPaths = ["/", "/pricing", "/login", "/signup", "/api/banner", "/api/webhooks"];
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isPublic) {
    return NextResponse.next();
  }

  // Dashboard routes — require authentication
  const protectedPaths = ["/dashboard", "/sites", "/settings"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    // TODO: Check auth session
    // const session = request.cookies.get("next-auth.session-token");
    // if (!session) {
    //   return NextResponse.redirect(new URL("/login", request.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes that handle their own auth
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
