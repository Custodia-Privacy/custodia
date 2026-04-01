/**
 * Next.js 16 Proxy (replaces middleware.ts).
 * Handles auth redirects, request routing, and security headers.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "off",
};

function applySecurityHeaders(response: NextResponse, pathname: string): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  if (pathname.startsWith("/embed/")) {
    response.headers.set("X-Frame-Options", "ALLOWALL");
    response.headers.set("Content-Security-Policy", "frame-ancestors *");
  } else if (pathname.startsWith("/api/v1/docs")) {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' data: https://cdn.jsdelivr.net; connect-src 'self' https:; frame-ancestors 'none';",
    );
  } else if (pathname.startsWith("/embed/") === false) {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
    );
  }
}

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
    "/api/v1",
    "/api/integrations",
  ];
  const isPublic =
    publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/request/") ||
    pathname.startsWith("/preference-center/");

  if (isPublic) {
    const response = NextResponse.next();
    applySecurityHeaders(response, pathname);
    return response;
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

  const response = NextResponse.next();
  applySecurityHeaders(response, pathname);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
