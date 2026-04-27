/**
 * Next.js 16 Proxy (replaces middleware.ts).
 * Handles auth redirects, request routing, and security headers.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Auth.js / NextAuth may split large JWT session cookies into `.0`, `.1`, … */
function hasSessionCookie(request: NextRequest): boolean {
  const exact = [
    "__Secure-next-auth.session-token",
    "next-auth.session-token",
    "authjs.session-token",
    "__Secure-authjs.session-token",
  ];
  for (const name of exact) {
    if (request.cookies.get(name)?.value) return true;
  }
  for (const { name } of request.cookies.getAll()) {
    if (
      name.startsWith("authjs.session-token.") ||
      name.startsWith("__Secure-authjs.session-token.") ||
      name.startsWith("next-auth.session-token.") ||
      name.startsWith("__Secure-next-auth.session-token.")
    ) {
      return true;
    }
  }
  return false;
}

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "off",
};

function applySecurityHeaders(
  response: NextResponse,
  pathname: string,
  request: NextRequest,
): void {
  const isHttps = request.nextUrl.protocol === "https:";
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    // Never send HSTS over plain HTTP (e.g. local dev). Browsers cache it and may
    // force HTTPS on localhost, which breaks NextAuth cookies and sign-in.
    if (key === "Strict-Transport-Security" && !isHttps) continue;
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
  } else if (pathname.startsWith("/api/auth")) {
    // Auth endpoints return JSON/HTML fragments for NextAuth — avoid document CSP
    // here (it applied to all routes and blocked Plausible + broke some browsers’
    // handling of credential posts when combined with third-party scripts).
    response.headers.set("X-Frame-Options", "DENY");
  } else if (pathname.startsWith("/embed/") === false) {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set(
      "Content-Security-Policy",
      // Plausible (root layout) — allow script + beacon to plausible.io
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://plausible.io; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: https://plausible.io; frame-ancestors 'none';",
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
    "/forgot-password",
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
    applySecurityHeaders(response, pathname, request);
    return response;
  }

  const protectedPaths = [
    "/dashboard",
    "/sites",
    "/settings",
    "/dsars",
    "/assessments",
    "/data-map",
    "/inventory",
    "/vendors",
    "/preferences",
    "/agents",
    "/assistant",
  ];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    if (!hasSessionCookie(request)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  applySecurityHeaders(response, pathname, request);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
