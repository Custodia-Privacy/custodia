import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { PolicyType } from "@prisma/client";
import { DEFAULT_POLICY_PAGE_STYLE, type PolicyPageStyle } from "@/lib/policy-page-defaults";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const POLICY_TYPE_LABELS: Record<string, string> = {
  privacy_policy: "Privacy Policy",
  cookie_policy: "Cookie Policy",
  terms_of_service: "Terms of Service",
  acceptable_use: "Acceptable Use Policy",
  data_processing: "Data Processing Agreement",
  custom: "Custom Policy",
};

type Props = { params: Promise<{ siteId: string; type: string }> };

interface SiblingPolicy {
  type: string;
  title: string;
}

interface TocEntry {
  id: string;
  text: string;
  level: number;
}

async function getPageData(siteId: string, type: string) {
  const [policy, siblings, site] = await Promise.all([
    db.policy.findUnique({
      where: { siteId_type: { siteId, type: type as PolicyType } },
      select: {
        title: true,
        type: true,
        contentMarkdown: true,
        publishedAt: true,
        version: true,
        updatedAt: true,
        site: { select: { domain: true } },
      },
    }),
    db.policy.findMany({
      where: { siteId, publishedAt: { not: null } },
      select: { type: true, title: true },
      orderBy: { title: "asc" },
    }),
    db.site.findFirst({
      where: { id: siteId, deletedAt: null },
      select: { policyPageStyle: true },
    }),
  ]);

  return { policy, siblings, site };
}

function mergeStyle(raw: unknown): PolicyPageStyle {
  const base = { ...DEFAULT_POLICY_PAGE_STYLE };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const r = raw as Record<string, unknown>;
  if (typeof r.fontFamily === "string") base.fontFamily = r.fontFamily;
  if (typeof r.fontColor === "string") base.fontColor = r.fontColor;
  if (typeof r.headingColor === "string") base.headingColor = r.headingColor;
  if (typeof r.backgroundColor === "string") base.backgroundColor = r.backgroundColor;
  if (typeof r.accentColor === "string") base.accentColor = r.accentColor;
  if (typeof r.logoUrl === "string") base.logoUrl = r.logoUrl;
  if (typeof r.logoLink === "string") base.logoLink = r.logoLink;
  if (typeof r.showTableOfContents === "boolean") base.showTableOfContents = r.showTableOfContents;
  if (typeof r.showPoweredBy === "boolean") base.showPoweredBy = r.showPoweredBy;
  return base;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractToc(markdown: string): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const line of markdown.split("\n")) {
    const m = line.match(/^(#{1,3})\s+(.+)/);
    if (m) {
      const text = m[2].replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").trim();
      entries.push({ id: slugify(text), text, level: m[1].length });
    }
  }
  return entries;
}

/**
 * Pre-process markdown to insert links for mentions of sibling policies.
 * Turns "Cookie Policy" into "[Cookie Policy](/p/siteId/cookie_policy)" when
 * that policy exists and is published — but only if it's not already a link.
 */
function autoLinkPoliciesInMarkdown(
  md: string,
  siblings: SiblingPolicy[],
  currentType: string,
  siteId: string,
): string {
  let result = md;
  for (const sib of siblings) {
    if (sib.type === currentType) continue;
    const label = POLICY_TYPE_LABELS[sib.type] ?? sib.title;
    const url = `/p/${siteId}/${sib.type}`;
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?<!\\[)\\b(${escaped})\\b(?!\\])(?!\\()`, "gi");
    result = result.replace(re, `[$1](${url})`);
  }
  return result;
}

function HeadingWithId({ level, children }: { level: number; children: React.ReactNode }) {
  const text = extractTextFromChildren(children);
  const id = slugify(text);
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
  return <Tag id={id}>{children}</Tag>;
}

function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join("");
  if (children && typeof children === "object" && "props" in children) {
    return extractTextFromChildren((children as React.ReactElement<{ children?: React.ReactNode }>).props.children);
  }
  return "";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { siteId, type } = await params;
  const { policy } = await getPageData(siteId, type);
  if (!policy || !policy.publishedAt) return {};

  return {
    title: `${policy.title} — ${policy.site.domain}`,
    description: `${policy.title} for ${policy.site.domain}`,
  };
}

export default async function PublicPolicyPage({ params }: Props) {
  const { siteId, type } = await params;
  const { policy, siblings, site } = await getPageData(siteId, type);

  if (!policy || !policy.publishedAt) notFound();

  const style = mergeStyle(site?.policyPageStyle);
  const rawMd = policy.contentMarkdown ?? "";
  const toc = extractToc(rawMd);
  const otherPolicies = siblings.filter((s) => s.type !== type);
  const processedMd = autoLinkPoliciesInMarkdown(rawMd, siblings, type, siteId);

  const mdComponents = {
    h1: ({ children }: { children?: React.ReactNode }) => <HeadingWithId level={1}>{children}</HeadingWithId>,
    h2: ({ children }: { children?: React.ReactNode }) => <HeadingWithId level={2}>{children}</HeadingWithId>,
    h3: ({ children }: { children?: React.ReactNode }) => <HeadingWithId level={3}>{children}</HeadingWithId>,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: style.backgroundColor, fontFamily: style.fontFamily }}>
      {/* Top navigation bar with logo + sibling policies */}
      {(style.logoUrl || otherPolicies.length > 0) && (
        <nav
          className="sticky top-0 z-10 border-b backdrop-blur-sm"
          style={{ borderColor: style.accentColor + "30", backgroundColor: style.backgroundColor + "ee" }}
        >
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
            {style.logoUrl && (
              <a href={style.logoLink || "/"} className="shrink-0">
                <img src={style.logoUrl} alt="Logo" className="h-7 w-auto" referrerPolicy="no-referrer" />
              </a>
            )}

            {otherPolicies.length > 0 && (
              <div className="flex flex-1 items-center gap-1 overflow-x-auto">
                <span
                  className="shrink-0 text-xs font-medium opacity-50 mr-1"
                  style={{ color: style.fontColor }}
                >
                  Policies:
                </span>
                {siblings.map((sib) => (
                  <a
                    key={sib.type}
                    href={`/p/${siteId}/${sib.type}`}
                    className="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors"
                    style={
                      sib.type === type
                        ? { backgroundColor: style.accentColor, color: "#fff" }
                        : { color: style.accentColor, backgroundColor: style.accentColor + "12" }
                    }
                  >
                    {POLICY_TYPE_LABELS[sib.type] ?? sib.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>
      )}

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
          {/* Sidebar TOC */}
          {style.showTableOfContents && toc.length > 2 && (
            <aside className="hidden lg:block">
              <div className="sticky top-20">
                <p
                  className="mb-3 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: style.accentColor }}
                >
                  On this page
                </p>
                <nav className="space-y-0.5">
                  {toc.map((entry) => (
                    <a
                      key={entry.id}
                      href={`#${entry.id}`}
                      className="block truncate text-[13px] leading-6 transition-colors hover:opacity-100"
                      style={{
                        color: style.fontColor,
                        opacity: 0.6,
                        paddingLeft: `${(entry.level - 1) * 12}px`,
                      }}
                    >
                      {entry.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Main content */}
          <div className={style.showTableOfContents && toc.length > 2 ? "" : "lg:col-span-2 max-w-3xl mx-auto w-full"}>
            {/* Mobile TOC */}
            {style.showTableOfContents && toc.length > 2 && (
              <details className="mb-8 rounded-lg border lg:hidden" style={{ borderColor: style.accentColor + "30" }}>
                <summary
                  className="cursor-pointer px-4 py-3 text-sm font-medium"
                  style={{ color: style.accentColor }}
                >
                  Table of Contents
                </summary>
                <nav className="space-y-0.5 px-4 pb-4">
                  {toc.map((entry) => (
                    <a
                      key={entry.id}
                      href={`#${entry.id}`}
                      className="block truncate text-sm leading-7"
                      style={{
                        color: style.fontColor,
                        opacity: 0.7,
                        paddingLeft: `${(entry.level - 1) * 12}px`,
                      }}
                    >
                      {entry.text}
                    </a>
                  ))}
                </nav>
              </details>
            )}

            {/* Policy body — rendered with ReactMarkdown for full GFM support (tables, etc.) */}
            <article
              className="prose max-w-none prose-headings:scroll-mt-24 prose-table:text-sm"
              style={{
                ["--tw-prose-body" as string]: style.fontColor,
                ["--tw-prose-headings" as string]: style.headingColor,
                ["--tw-prose-links" as string]: style.accentColor,
                ["--tw-prose-bold" as string]: style.headingColor,
                ["--tw-prose-counters" as string]: style.accentColor,
                ["--tw-prose-bullets" as string]: style.accentColor + "80",
                ["--tw-prose-th-borders" as string]: style.fontColor + "20",
                ["--tw-prose-td-borders" as string]: style.fontColor + "10",
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {processedMd}
              </ReactMarkdown>
            </article>

            {/* Footer */}
            <footer
              className="mt-12 border-t pt-6"
              style={{ borderColor: style.fontColor + "15" }}
            >
              {otherPolicies.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-medium mb-2" style={{ color: style.fontColor, opacity: 0.5 }}>
                    Related policies
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {otherPolicies.map((sib) => (
                      <a
                        key={sib.type}
                        href={`/p/${siteId}/${sib.type}`}
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          borderColor: style.accentColor + "30",
                          color: style.accentColor,
                        }}
                      >
                        {POLICY_TYPE_LABELS[sib.type] ?? sib.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {style.showPoweredBy && (
                <p className="text-center text-xs" style={{ color: style.fontColor, opacity: 0.35 }}>
                  Powered by{" "}
                  <a
                    href="https://custodia-privacy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: style.fontColor, opacity: 0.6 }}
                  >
                    Custodia
                  </a>
                </p>
              )}
            </footer>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `html { scroll-behavior: smooth; }` }} />
    </div>
  );
}
