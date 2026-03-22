/**
 * Site Crawler — uses Playwright to crawl a website and analyze it.
 *
 * For each page visited, captures:
 * - All cookies (first-party and third-party)
 * - Network requests to known trackers
 * - Third-party scripts
 * - Forms that collect personal data
 */
import type { PageScanResult } from "../../src/types";

interface CrawlOptions {
  domain: string;
  maxPages: number;
}

interface CrawlResult {
  pages: PageScanResult[];
  totalCookies: number;
  totalTrackers: number;
  totalScripts: number;
  totalForms: number;
  crawlDuration: number;
}

export async function crawlSite(options: CrawlOptions): Promise<CrawlResult> {
  const { domain, maxPages } = options;
  const startTime = Date.now();

  // Dynamically import Playwright to avoid loading it at module level
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (compatible; CustodiaBot/1.0; +https://custodia-privacy.com/bot)",
    });

    const visited = new Set<string>();
    const toVisit = [`https://${domain}`];
    const results: PageScanResult[] = [];

    while (toVisit.length > 0 && visited.size < maxPages) {
      const url = toVisit.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);

      try {
        const pageResult = await crawlPage(context, url, domain);
        results.push(pageResult);

        // TODO: Extract internal links from page for further crawling
        // Only follow links on the same domain
      } catch (err) {
        console.warn(`Failed to crawl ${url}:`, err);
      }
    }

    const totalCookies = results.reduce((sum, p) => sum + p.cookies.length, 0);
    const totalTrackers = results.reduce((sum, p) => sum + p.trackers.length, 0);
    const totalScripts = results.reduce((sum, p) => sum + p.scripts.length, 0);
    const totalForms = results.reduce((sum, p) => sum + p.forms.length, 0);

    return {
      pages: results,
      totalCookies,
      totalTrackers,
      totalScripts,
      totalForms,
      crawlDuration: Date.now() - startTime,
    };
  } finally {
    await browser.close();
  }
}

async function crawlPage(
  context: Awaited<ReturnType<Awaited<ReturnType<typeof import("playwright")>["chromium"]["launch"]>>["newContext"]>,
  url: string,
  domain: string,
): Promise<PageScanResult> {
  const page = await context.newPage();

  // Track network requests for tracker detection
  const networkRequests: string[] = [];
  page.on("request", (req) => {
    networkRequests.push(req.url());
  });

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

    // Capture cookies
    const cookies = await context.cookies();
    // TODO: Classify cookies using known-trackers database

    // Detect third-party scripts
    const scripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("script[src]")).map((el) => ({
        src: (el as HTMLScriptElement).src,
      }));
    });

    // Detect forms
    const forms = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("form")).map((form) => ({
        action: form.action,
        method: form.method,
        fields: Array.from(form.querySelectorAll("input, select, textarea")).map(
          (field) => ({
            name: (field as HTMLInputElement).name,
            type: (field as HTMLInputElement).type,
            label: null as string | null,
          }),
        ),
      }));
    });

    return {
      url,
      cookies: cookies.map((c) => ({
        name: c.name,
        domain: c.domain,
        path: c.path,
        secure: c.secure,
        httpOnly: c.httpOnly,
        sameSite: c.sameSite,
        expires: c.expires > 0 ? new Date(c.expires * 1000).toISOString() : null,
        category: "unknown" as const,
        description: null,
        knownService: null,
      })),
      trackers: [], // TODO: Match network requests against known tracker list
      scripts: scripts.map((s) => ({
        src: s.src,
        isThirdParty: !s.src.includes(domain),
        service: null,
        category: null,
      })),
      forms: forms.map((f) => ({
        ...f,
        collectsPersonalData: f.fields.some((field) =>
          ["email", "tel", "name", "address", "password"].some(
            (pii) =>
              field.name.toLowerCase().includes(pii) ||
              field.type === "email" ||
              field.type === "tel",
          ),
        ),
      })),
    };
  } finally {
    await page.close();
  }
}
