/**
 * Lightweight inline scanner for quick/lead-gen scans.
 * Uses HTTP fetch + HTML parsing — no Playwright or BullMQ required.
 *
 * SSRF: outbound fetch MUST go through `fetchSafely`, which validates
 * DNS resolution and re-checks every redirect hop.
 */
import { PrismaClient, Prisma, type FindingCategory, type Severity } from "@prisma/client";
import { fetchSafely, SsrfError } from "./ip-check";

interface TrackerPattern {
  name: string;
  patterns: RegExp[];
  category: "analytics" | "advertising" | "social" | "customer-support" | "payments" | "security" | "other";
  description: string;
  severity: Severity;
  findingCategory: FindingCategory;
  recommendation: string;
}

const TRACKER_PATTERNS: TrackerPattern[] = [
  {
    name: "Google Analytics (GA4)",
    patterns: [/google-analytics\.com/, /googletagmanager\.com/, /gtag\s*\(/, /www\.googletagmanager\.com/],
    category: "analytics",
    description: "Collects website usage data including page views, session duration, and user demographics.",
    severity: "warning",
    findingCategory: "tracker",
    recommendation: "Ensure consent is collected before loading Google Analytics. Implement a consent management platform.",
  },
  {
    name: "Meta Pixel (Facebook)",
    patterns: [/connect\.facebook\.net/, /fbevents\.js/, /facebook\.com\/tr/, /fbq\s*\(/],
    category: "advertising",
    description: "Tracks user activity for ad targeting and conversion measurement across Meta platforms.",
    severity: "critical",
    findingCategory: "tracker",
    recommendation: "Meta Pixel requires explicit consent under GDPR/CCPA. Load only after user opts in.",
  },
  {
    name: "Google Ads / DoubleClick",
    patterns: [/doubleclick\.net/, /googlesyndication\.com/, /googleadservices\.com/],
    category: "advertising",
    description: "Serves targeted ads and tracks ad conversions.",
    severity: "critical",
    findingCategory: "tracker",
    recommendation: "Advertising trackers require explicit opt-in consent in most jurisdictions.",
  },
  {
    name: "Hotjar",
    patterns: [/hotjar\.com/, /static\.hotjar\.com/],
    category: "analytics",
    description: "Records user sessions, heatmaps, and behavior analytics.",
    severity: "warning",
    findingCategory: "tracker",
    recommendation: "Session recording tools require disclosure and consent. Update your privacy policy.",
  },
  {
    name: "Microsoft Clarity",
    patterns: [/clarity\.ms/],
    category: "analytics",
    description: "Session recordings and heatmaps for user behavior analysis.",
    severity: "warning",
    findingCategory: "tracker",
    recommendation: "Disclose session recording in your privacy policy and obtain consent before loading.",
  },
  {
    name: "TikTok Pixel",
    patterns: [/analytics\.tiktok\.com/, /tiktok\.com\/i18n/],
    category: "advertising",
    description: "Tracks conversions and user activity for TikTok ad targeting.",
    severity: "critical",
    findingCategory: "tracker",
    recommendation: "Advertising pixel requires consent before loading.",
  },
  {
    name: "LinkedIn Insight Tag",
    patterns: [/snap\.licdn\.com/, /linkedin\.com\/insight/],
    category: "advertising",
    description: "Tracks website conversions for LinkedIn ad campaigns.",
    severity: "warning",
    findingCategory: "tracker",
    recommendation: "Obtain consent before loading LinkedIn tracking scripts.",
  },
  {
    name: "Segment",
    patterns: [/cdn\.segment\.com/, /segment\.io/, /analytics\.js/],
    category: "analytics",
    description: "Customer data platform that collects and routes analytics data to multiple services.",
    severity: "warning",
    findingCategory: "tracker",
    recommendation: "Segment routes data to many destinations. Audit downstream services and obtain appropriate consent.",
  },
  {
    name: "Mixpanel",
    patterns: [/cdn\.mxpnl\.com/, /mixpanel\.com/],
    category: "analytics",
    description: "Product analytics tracking user events and behavior.",
    severity: "warning",
    findingCategory: "tracker",
    recommendation: "Ensure analytics data collection is disclosed in your privacy policy.",
  },
  {
    name: "Amplitude",
    patterns: [/cdn\.amplitude\.com/, /amplitude\.com/],
    category: "analytics",
    description: "Product analytics platform for user behavior tracking.",
    severity: "warning",
    findingCategory: "tracker",
    recommendation: "Disclose analytics usage and collect consent where required.",
  },
  {
    name: "FullStory",
    patterns: [/fullstory\.com/],
    category: "analytics",
    description: "Session replay and digital experience analytics.",
    severity: "warning",
    findingCategory: "tracker",
    recommendation: "Session replay captures sensitive user interactions. Require consent and mask PII.",
  },
  {
    name: "Intercom",
    patterns: [/widget\.intercom\.io/, /intercomcdn\.com/],
    category: "customer-support",
    description: "Customer messaging platform that may collect visitor data.",
    severity: "info",
    findingCategory: "script",
    recommendation: "Disclose Intercom data collection in your privacy policy.",
  },
  {
    name: "HubSpot",
    patterns: [/js\.hs-scripts\.com/, /hs-analytics\.net/, /hubspot\.com/],
    category: "analytics",
    description: "Marketing and CRM analytics tracking.",
    severity: "warning",
    findingCategory: "tracker",
    recommendation: "HubSpot tracks visitors for marketing. Ensure consent is obtained.",
  },
  {
    name: "Stripe.js",
    patterns: [/js\.stripe\.com/],
    category: "payments",
    description: "Payment processing — functional service for accepting payments.",
    severity: "ok",
    findingCategory: "script",
    recommendation: "Stripe is typically classified as a necessary/functional service. Disclose in privacy policy.",
  },
  {
    name: "Sentry",
    patterns: [/browser\.sentry-cdn\.com/, /sentry\.io/],
    category: "other",
    description: "Error monitoring that collects diagnostic data including IP addresses.",
    severity: "info",
    findingCategory: "script",
    recommendation: "Configure Sentry to scrub PII. Disclose error monitoring in your privacy policy.",
  },
  {
    name: "Crisp Chat",
    patterns: [/client\.crisp\.chat/],
    category: "customer-support",
    description: "Live chat widget that collects visitor information.",
    severity: "info",
    findingCategory: "script",
    recommendation: "Disclose chat widget data collection. Configure data retention settings.",
  },
  {
    name: "Drift",
    patterns: [/js\.driftt\.com/, /drift\.com/],
    category: "customer-support",
    description: "Conversational marketing platform and live chat.",
    severity: "info",
    findingCategory: "script",
    recommendation: "Review Drift's data collection and disclose in your privacy policy.",
  },
  {
    name: "reCAPTCHA",
    patterns: [/google\.com\/recaptcha/, /recaptcha/],
    category: "security",
    description: "Bot protection that collects browser fingerprint data.",
    severity: "info",
    findingCategory: "script",
    recommendation: "reCAPTCHA collects behavioral data. Some regulators consider this beyond 'strictly necessary'.",
  },
];

interface QuickScanResult {
  findingsCreated: number;
  hasPrivacyPolicy: boolean;
  hasConsentBanner: boolean;
  trackersFound: string[];
}

export interface ParsedCookie {
  name: string;
  value: string;
  domain: string | null;
  path: string | null;
  secure: boolean;
  httpOnly: boolean;
  sameSite: "Strict" | "Lax" | "None" | null;
}

/**
 * Parse a single Set-Cookie header value into structured fields.
 * We only care about the name + attributes; values are retained for
 * completeness but not surfaced to the user. Returns null for any
 * header we can't make sense of.
 */
export function parseSetCookie(header: string): ParsedCookie | null {
  const parts = header.split(";").map((p) => p.trim());
  if (parts.length === 0) return null;

  const [nameValue, ...attrs] = parts;
  const eq = nameValue.indexOf("=");
  if (eq <= 0) return null;

  const name = nameValue.slice(0, eq).trim();
  const value = nameValue.slice(eq + 1);
  if (!name) return null;

  const cookie: ParsedCookie = {
    name,
    value,
    domain: null,
    path: null,
    secure: false,
    httpOnly: false,
    sameSite: null,
  };

  for (const attr of attrs) {
    const lower = attr.toLowerCase();
    if (lower === "secure") cookie.secure = true;
    else if (lower === "httponly") cookie.httpOnly = true;
    else if (lower.startsWith("domain=")) {
      // Normalize leading dot (.example.com → example.com) so host
      // comparisons are straightforward.
      cookie.domain = attr.slice(7).trim().replace(/^\./, "").toLowerCase();
    } else if (lower.startsWith("path=")) {
      cookie.path = attr.slice(5).trim();
    } else if (lower.startsWith("samesite=")) {
      const v = attr.slice(9).trim().toLowerCase();
      if (v === "strict") cookie.sameSite = "Strict";
      else if (v === "lax") cookie.sameSite = "Lax";
      else if (v === "none") cookie.sameSite = "None";
    }
  }

  return cookie;
}

/**
 * True iff the cookie's domain is the same registrable site as the
 * scanned domain. This is a deliberately simple check — full eTLD+1
 * parsing requires the Public Suffix List, which isn't worth pulling in
 * for a lead-gen scan. `foo.example.com` vs `example.com` counts as
 * same-site here, which matches how browsers treat them for the
 * cookie's scoping.
 */
export function isSameSite(cookieDomain: string, siteDomain: string): boolean {
  const cd = cookieDomain.toLowerCase();
  const sd = siteDomain.toLowerCase();
  if (cd === sd) return true;
  if (cd.endsWith("." + sd)) return true;
  if (sd.endsWith("." + cd)) return true;
  return false;
}

/**
 * Build a user-facing description that highlights why this cookie is
 * notable. Missing security attributes are called out — a tracking
 * cookie without Secure or without SameSite is a real finding, not
 * just noise.
 */
function describeCookie(c: ParsedCookie): string {
  const flags: string[] = [];
  if (!c.secure) flags.push("no Secure flag");
  if (!c.httpOnly) flags.push("no HttpOnly flag");
  if (c.sameSite === null) flags.push("no SameSite attribute");
  else if (c.sameSite === "None") flags.push("SameSite=None (cross-site tracking allowed)");

  const base = `Set in the HTTP response by ${c.domain}. Third-party cookies are commonly used for tracking, advertising, and cross-site analytics.`;
  if (flags.length === 0) return base;
  return `${base} Missing protections: ${flags.join(", ")}.`;
}

export async function runQuickScan(
  db: PrismaClient,
  scanId: string,
  siteId: string,
  domain: string,
): Promise<QuickScanResult> {
  await db.scan.update({
    where: { id: scanId },
    data: { status: "running", startedAt: new Date() },
  });

  let html = "";
  let setCookieHeaders: string[] = [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    const url = `https://${domain}`;
    const res = await fetchSafely(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      maxRedirects: 5,
    });
    clearTimeout(timeout);

    html = await res.text();
    setCookieHeaders = res.headers.getSetCookie?.() ?? [];
  } catch (err) {
    const isSsrf = err instanceof SsrfError;
    const message = err instanceof Error ? err.message : "Connection failed";
    await db.scan.update({
      where: { id: scanId },
      data: {
        status: "failed",
        completedAt: new Date(),
        errorMessage: isSsrf
          ? `Target domain ${domain} resolves to a blocked address.`
          : `Could not reach ${domain}: ${message}`,
      },
    });
    return { findingsCreated: 0, hasPrivacyPolicy: false, hasConsentBanner: false, trackersFound: [] };
  }

  const findings: Array<{
    scanId: string;
    siteId: string;
    category: FindingCategory;
    severity: Severity;
    title: string;
    description: string;
    recommendation: string | null;
    details?: Prisma.InputJsonValue;
    regulations: string[];
    pageUrl: string;
  }> = [];

  const pageUrl = `https://${domain}`;
  const trackersFound: string[] = [];
  const htmlLower = html.toLowerCase();

  for (const tracker of TRACKER_PATTERNS) {
    const detected = tracker.patterns.some((p) => p.test(html) || p.test(htmlLower));
    if (detected) {
      trackersFound.push(tracker.name);
      findings.push({
        scanId,
        siteId,
        category: tracker.findingCategory,
        severity: tracker.severity,
        title: `${tracker.name} detected`,
        description: tracker.description,
        recommendation: tracker.recommendation,
        regulations: ["gdpr", "ccpa"],
        pageUrl,
      });
    }
  }

  const hasPrivacyPolicy =
    /privacy[\s-]*policy/i.test(html) ||
    /href="[^"]*privacy/i.test(html) ||
    /href="[^"]*datenschutz/i.test(html);

  const hasConsentBanner =
    (/cookie/i.test(html) && (/consent/i.test(html) || /accept.*cookies/i.test(html))) ||
    /OneTrust/i.test(html) ||
    /CookieBot/i.test(html) ||
    /cookieconsent/i.test(html) ||
    /Osano/i.test(html) ||
    /CookieYes/i.test(html);

  if (!hasPrivacyPolicy) {
    findings.push({
      scanId,
      siteId,
      category: "policy",
      severity: "critical",
      title: "No privacy policy link detected",
      description:
        "Could not find a privacy policy link on your homepage. A privacy policy is legally required under GDPR, CCPA, and most privacy regulations.",
      recommendation:
        "Add a clearly visible privacy policy link in your website footer. Custodia can generate a compliant policy for you.",
      regulations: ["gdpr", "ccpa"],
      pageUrl,
    });
  }

  if (!hasConsentBanner && trackersFound.length > 0) {
    findings.push({
      scanId,
      siteId,
      category: "consent",
      severity: "critical",
      title: "No cookie consent mechanism detected",
      description: `Your site loads ${trackersFound.length} tracker(s) but no consent management tool was found. Under GDPR, non-essential cookies/trackers require opt-in consent.`,
      recommendation:
        "Implement a consent management platform (CMP) that blocks trackers until the user opts in. Custodia provides a built-in consent banner.",
      regulations: ["gdpr", "ccpa"],
      pageUrl,
    });
  }

  // Parse each Set-Cookie header into structured data and surface one
  // finding per third-party cookie. Previously we collapsed them into a
  // single "N third-party cookie(s) set" row, which hid the most useful
  // information: *which* cookies, set by *whom*. Listing them makes the
  // report materially more actionable (and, for the public lead-gen scan,
  // more persuasive — a visitor seeing "_fbp set by .facebook.com" gets
  // the compliance problem instantly).
  if (setCookieHeaders.length > 0) {
    const parsedThirdParty = setCookieHeaders
      .map(parseSetCookie)
      .filter((c): c is ParsedCookie => c !== null)
      .filter((c) => c.domain !== null && !isSameSite(c.domain, domain));

    // Cap to keep the report digestible on sites with extreme cookie
    // counts. If a site has more, we add a single "+N more" row rather
    // than rendering 80 cards.
    const MAX_COOKIE_FINDINGS = 20;
    const visible = parsedThirdParty.slice(0, MAX_COOKIE_FINDINGS);
    const overflow = parsedThirdParty.length - visible.length;

    for (const cookie of visible) {
      findings.push({
        scanId,
        siteId,
        category: "cookie",
        severity: "warning",
        title: `Third-party cookie: ${cookie.name} (${cookie.domain})`,
        description: describeCookie(cookie),
        recommendation:
          "Ensure this cookie is blocked by your consent mechanism until the visitor opts in, or justify it as strictly necessary with a documented legal basis.",
        details: {
          name: cookie.name,
          domain: cookie.domain,
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          sameSite: cookie.sameSite,
          path: cookie.path,
        },
        regulations: ["gdpr", "ccpa"],
        pageUrl,
      });
    }

    if (overflow > 0) {
      findings.push({
        scanId,
        siteId,
        category: "cookie",
        severity: "warning",
        title: `+${overflow} more third-party cookie${overflow === 1 ? "" : "s"} not shown`,
        description:
          "The report was capped so results stay readable. Sign up for a full site scan to see every third-party cookie with full attributes.",
        recommendation:
          "Run a deeper scan from the dashboard to audit the complete cookie inventory.",
        regulations: ["gdpr", "ccpa"],
        pageUrl,
      });
    }
  }

  if (findings.length > 0) {
    await db.finding.createMany({ data: findings });
  }

  await db.scan.update({
    where: { id: scanId },
    data: {
      status: "completed",
      completedAt: new Date(),
      pagesCrawled: 1,
      summary: {
        trackersFound: trackersFound.length,
        hasPrivacyPolicy,
        hasConsentBanner,
        issueCount: findings.filter((f) => f.severity === "critical" || f.severity === "warning").length,
      },
    },
  });

  return { findingsCreated: findings.length, hasPrivacyPolicy, hasConsentBanner, trackersFound };
}
