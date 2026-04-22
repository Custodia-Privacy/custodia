/**
 * Lightweight inline scanner for quick/lead-gen scans.
 * Uses HTTP fetch + HTML parsing — no Playwright or BullMQ required.
 *
 * SSRF: outbound fetch MUST go through `fetchSafely`, which validates
 * DNS resolution and re-checks every redirect hop.
 */
import { PrismaClient, type FindingCategory, type Severity } from "@prisma/client";
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

  if (setCookieHeaders.length > 0) {
    const thirdParty = setCookieHeaders.filter((c) => {
      const domainMatch = c.match(/domain=([^;]+)/i);
      if (!domainMatch) return false;
      return !domainMatch[1].includes(domain);
    });
    if (thirdParty.length > 0) {
      findings.push({
        scanId,
        siteId,
        category: "cookie",
        severity: "warning",
        title: `${thirdParty.length} third-party cookie(s) set via HTTP headers`,
        description:
          "Third-party cookies were set in the HTTP response headers. These may be used for tracking across sites.",
        recommendation:
          "Review third-party cookies and ensure they are covered by your consent mechanism.",
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
