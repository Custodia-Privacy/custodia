import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Compliance Blog — Custodia",
  description:
    "Practical guides on GDPR, CCPA, cookie consent, and privacy compliance for small businesses.",
};

const posts = [
  {
    slug: "gdpr-compliance-small-business",
    title: "GDPR Compliance for Small Business: The 2026 Guide",
    excerpt:
      "Everything you need to know about GDPR compliance — without a legal team or a six-figure budget. Covers requirements, common mistakes, and a step-by-step checklist.",
    date: "March 2026",
    readTime: "10 min read",
    tags: ["GDPR", "Compliance", "Small Business"],
  },
  {
    slug: "ai-privacy-policy-generator",
    title: "AI Privacy Policy Generator: How It Works and Why Templates Fall Short",
    excerpt:
      "Your privacy policy should describe what your website actually does — not what a template guesses it might do. Here's how AI generation works and what to look for.",
    date: "March 2026",
    readTime: "8 min read",
    tags: ["Privacy Policy", "AI", "GDPR", "CCPA"],
  },
  {
    slug: "cookie-consent-management-tool",
    title: "Cookie Consent Management: Beyond the Banner",
    excerpt:
      "A cookie banner is not a consent management solution. Here's what you actually need — and how to get there without enterprise pricing.",
    date: "March 2026",
    readTime: "9 min read",
    tags: ["Cookie Consent", "GDPR", "Google Consent Mode"],
  },
];

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 pt-28 pb-20">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-navy-950 dark:text-white">
          Privacy Compliance Blog
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          Practical guides for small businesses navigating GDPR, CCPA, and beyond.
        </p>
      </div>

      {/* Post list */}
      <div className="space-y-8">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-3 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Link href={`/blog/${post.slug}`}>
              <h2 className="mb-3 text-xl font-semibold text-navy-950 transition-colors group-hover:text-navy-700 dark:text-white dark:group-hover:text-navy-300">
                {post.title}
              </h2>
            </Link>
            <p className="mb-4 text-slate-600 dark:text-slate-400">{post.excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-500">
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>
              <Link
                href={`/blog/${post.slug}`}
                className="text-sm font-medium text-navy-700 transition-colors hover:text-navy-900 dark:text-navy-400 dark:hover:text-navy-200"
              >
                Read more →
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 rounded-2xl bg-navy-950 px-8 py-10 text-center dark:bg-navy-900">
        <h2 className="text-2xl font-bold text-white">
          See what your website is collecting
        </h2>
        <p className="mt-2 text-slate-300">
          Free scan — no signup required. Results in 60 seconds.
        </p>
        <Link
          href="https://app.custodia-privacy.com"
          className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-navy-950 transition-colors hover:bg-slate-100"
        >
          Scan Your Website Free →
        </Link>
      </div>
    </div>
  );
}
