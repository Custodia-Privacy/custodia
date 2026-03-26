import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * Public policy endpoint — serves published policies for a site.
 * No auth required. Respects the `publishedAt` gate: only serves policies
 * that have been explicitly published.
 *
 * GET /api/public/policy/SITE_ID?type=privacy_policy
 *   → Returns JSON { title, type, contentHtml, contentMarkdown, publishedAt, version }
 *
 * GET /api/public/policy/SITE_ID?type=privacy_policy&format=html
 *   → Returns a standalone HTML page rendering the policy (for iframe embedding or direct link)
 */
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await props.params;
  const type = req.nextUrl.searchParams.get("type") ?? "privacy_policy";
  const format = req.nextUrl.searchParams.get("format");

  const policy = await db.policy.findUnique({
    where: { siteId_type: { siteId, type } },
    select: {
      title: true,
      type: true,
      contentHtml: true,
      contentMarkdown: true,
      publishedAt: true,
      version: true,
      site: {
        select: {
          domain: true,
          org: {
            select: {
              name: true,
              brandName: true,
              brandColor: true,
              brandLogoUrl: true,
            },
          },
        },
      },
    },
  });

  if (!policy || !policy.publishedAt) {
    return NextResponse.json(
      { error: "not_found", message: "No published policy found" },
      { status: 404 },
    );
  }

  const cacheHeaders = {
    "Cache-Control": "public, max-age=300, s-maxage=3600",
    "Access-Control-Allow-Origin": "*",
  };

  if (format === "html") {
    const html = renderStandalonePage(
      policy.title,
      policy.contentHtml ?? policy.contentMarkdown ?? "",
    );

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", ...cacheHeaders },
    });
  }

  return NextResponse.json(
    {
      title: policy.title,
      type: policy.type,
      contentHtml: policy.contentHtml,
      contentMarkdown: policy.contentMarkdown,
      publishedAt: policy.publishedAt,
      version: policy.version,
      domain: policy.site.domain,
      branding: {
        companyName: policy.site.org.brandName || policy.site.org.name,
        accentColor: policy.site.org.brandColor || null,
        logoUrl: policy.site.org.brandLogoUrl || null,
      },
    },
    { headers: cacheHeaders },
  );
}

function renderStandalonePage(title: string, body: string): string {
  const isMarkdown = !body.includes("<h1") && !body.includes("<h2");
  const renderedBody = isMarkdown
    ? body
        .replace(/^### (.+)$/gm, "<h3>$1</h3>")
        .replace(/^## (.+)$/gm, "<h2>$1</h2>")
        .replace(/^# (.+)$/gm, "<h1>$1</h1>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/^- (.+)$/gm, "<li>$1</li>")
        .replace(/\n\n/g, "<br><br>")
    : body;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="robots" content="index, follow">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.7; color: #1e293b; background: #fff;
      padding: 2rem 1rem; max-width: 48rem; margin: 0 auto;
    }
    h1 { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem; }
    h2 { font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-top: 2rem; margin-bottom: 0.5rem; }
    h3 { font-size: 1.05rem; font-weight: 600; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.4rem; }
    p, li { font-size: 0.95rem; color: #334155; margin-bottom: 0.6rem; }
    ul, ol { padding-left: 1.5rem; margin-bottom: 1rem; }
    a { color: #4f46e5; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.9rem; }
    th, td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
    footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;
             font-size: 0.75rem; color: #94a3b8; text-align: center; }
    footer a { color: #64748b; }
    @media (prefers-color-scheme: dark) {
      body { background: #0f172a; color: #e2e8f0; }
      h1, h2, h3 { color: #f8fafc; }
      p, li { color: #cbd5e1; }
      th { background: #1e293b; }
      th, td { border-color: #334155; }
      footer { border-color: #334155; color: #64748b; }
    }
  </style>
</head>
<body>
  <main>${renderedBody}</main>
  <footer>
    Powered by <a href="https://custodia-privacy.com" target="_blank" rel="noopener">Custodia</a>
  </footer>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
