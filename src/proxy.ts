/**
 * Next.js 16 Proxy (replaces middleware.ts).
 * Handles auth redirects and request routing.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = [
    "/",
    "/pricing",
    "/login",
    "/signup",
    "/api/banner",
    "/api/webhooks",
    "/api/auth",
    "/api/trpc",
    "/api/public",
  ];
  const isPublic =
    publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/request/") ||
    pathname.startsWith("/preference-center/");

  if (isPublic) {
    return NextResponse.next();
  }

  const protectedPaths = [
    "/dashboard",
    "/sites",
    "/settings",
    "/dsars",
    "/assessments",
    "/data-map",
    "/vendors",
    "/preferences",
    "/agents",
    "/assistant",
  ];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const sessionToken =
      request.cookies.get("__Secure-next-auth.session-token") ??
      request.cookies.get("next-auth.session-token") ??
      request.cookies.get("authjs.session-token") ??
      request.cookies.get("__Secure-authjs.session-token");

    if (!sessionToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
