/**
 * IP address and URL safety checks for SSRF prevention.
 *
 * Validates that URLs and resolved IPs do not point to internal
 * or cloud metadata services. Covers IPv4, IPv6, DNS resolution,
 * manual redirect following, and cloud provider metadata endpoints.
 *
 * For defense-in-depth use `fetchSafely` over raw `fetch` for ALL
 * outbound requests that take a user-supplied URL.
 */

import { lookup } from "node:dns/promises";

const PRIVATE_IPV4_CIDRS = [
  { prefix: "10.", mask: 8 },
  { prefix: "127.", mask: 8 },
  { prefix: "169.254.", mask: 16 },
  { prefix: "192.168.", mask: 16 },
];

function isPrivateIPv4(ip: string): boolean {
  if (ip === "0.0.0.0" || ip === "0") return true;

  for (const cidr of PRIVATE_IPV4_CIDRS) {
    if (ip.startsWith(cidr.prefix)) return true;
  }

  const match172 = ip.match(/^172\.(\d+)\./);
  if (match172) {
    const second = parseInt(match172[1], 10);
    if (second >= 16 && second <= 31) return true;
  }

  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().replace(/^\[|\]$/g, "");

  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1") return true;

  if (normalized.startsWith("fe80:") || normalized.startsWith("fe80%")) return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  if (normalized.startsWith("::ffff:")) {
    const v4Part = normalized.slice(7);
    if (isPrivateIPv4(v4Part)) return true;
  }

  return false;
}

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "0",
  "[::1]",
  "::1",
  "[0:0:0:0:0:0:0:1]",
  "169.254.169.254",
  "169.254.170.2",
  "metadata.google.internal",
  "metadata.internal",
  "instance-data",
]);

/**
 * Check whether a URL is safe to fetch (not pointing at internal resources).
 * Use at both registration time and delivery time for defense-in-depth.
 */
export function isSafeUrl(url: string, requireHttps = false): boolean {
  try {
    const u = new URL(url);

    if (requireHttps && u.protocol !== "https:") return false;
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;

    const hostname = u.hostname.toLowerCase();

    if (BLOCKED_HOSTS.has(hostname)) return false;

    if (hostname.endsWith(".internal") || hostname.endsWith(".local")) return false;

    if (isPrivateIPv4(hostname)) return false;
    if (isPrivateIPv6(hostname)) return false;

    if (u.port && ["6379", "5432", "3306", "27017", "11211"].includes(u.port)) return false;

    return true;
  } catch {
    return false;
  }
}

const IPV4_LITERAL_RE = /^\d{1,3}(?:\.\d{1,3}){3}$/;

/**
 * Resolve a hostname via the system DNS resolver and validate every
 * returned address against the private/loopback/link-local ranges.
 *
 * Caveat: this does NOT protect against DNS rebinding across the gap
 * between this call and the subsequent fetch. Full protection would
 * require pinning the resolved IP into a custom undici Dispatcher.
 * Accepted trade-off for launch — logged as a future hardening.
 */
export async function resolveAndValidate(
  hostname: string,
): Promise<{ safe: true; addresses: string[] } | { safe: false; reason: string }> {
  try {
    const results = await lookup(hostname, { all: true, family: 0 });
    const addresses = results.map((r) => r.address);
    if (addresses.length === 0) {
      return { safe: false, reason: "no DNS records" };
    }
    for (const addr of addresses) {
      if (addr.includes(":")) {
        if (isPrivateIPv6(addr)) {
          return { safe: false, reason: `resolved to private IPv6 ${addr}` };
        }
      } else if (isPrivateIPv4(addr)) {
        return { safe: false, reason: `resolved to private IPv4 ${addr}` };
      }
    }
    return { safe: true, addresses };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code ?? "unknown";
    return { safe: false, reason: `DNS lookup failed (${code})` };
  }
}

export class SsrfError extends Error {
  constructor(public readonly hop: number, message: string) {
    super(message);
    this.name = "SsrfError";
  }
}

/**
 * Fetch a URL with SSRF protection. At every hop:
 *   1. `isSafeUrl` passes (protocol + hostname-string blocklist + port block)
 *   2. DNS resolution yields zero private/loopback/link-local addresses
 *   3. Redirects are followed manually, with the same checks re-applied
 *
 * Throws `SsrfError` on any violation. Redirects cap at `maxRedirects` (default 5).
 */
export async function fetchSafely(
  url: string,
  init: Omit<RequestInit, "redirect"> & { maxRedirects?: number } = {},
): Promise<Response> {
  const maxRedirects = init.maxRedirects ?? 5;
  const { maxRedirects: _m, ...fetchInit } = init;
  let current = url;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (!isSafeUrl(current)) {
      throw new SsrfError(hop, `URL rejected by isSafeUrl: ${current}`);
    }
    const parsed = new URL(current);
    const hostIsIpLiteral =
      IPV4_LITERAL_RE.test(parsed.hostname) || parsed.hostname.includes(":");

    if (!hostIsIpLiteral) {
      const dns = await resolveAndValidate(parsed.hostname);
      if (!dns.safe) {
        throw new SsrfError(hop, dns.reason);
      }
    }

    const res = await fetch(current, { ...fetchInit, redirect: "manual" });

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return res;
      current = new URL(loc, current).toString();
      continue;
    }

    return res;
  }

  throw new SsrfError(maxRedirects + 1, `too many redirects (> ${maxRedirects})`);
}

/**
 * Get the real client IP, preferring Cloudflare's header
 * (not spoofable when behind CF), falling back to X-Real-IP,
 * then X-Forwarded-For with caution.
 */
export function getClientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";

  return "unknown";
}
