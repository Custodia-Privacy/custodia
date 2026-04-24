import fs from "node:fs";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders a markdown file from content/legal/ with a consistent prose layout.
 * Reads the file at build/request time. Fails loudly if the file is missing
 * — that would be a deploy bug, and we'd rather 500 than serve an empty page.
 */
export function LegalPage({
  fileBasename,
  title,
  subtitle,
  generatedNote,
}: {
  fileBasename: "privacy" | "terms";
  title: string;
  subtitle?: string;
  generatedNote?: string;
}) {
  const filePath = path.join(process.cwd(), "content", "legal", `${fileBasename}.md`);
  const raw = fs.readFileSync(filePath, "utf8");
  // The markdown files start with "# Privacy Policy" / "# Terms of Service".
  // We render the title ourselves in the header above, so strip the first H1
  // (and the blank line after it) to avoid a duplicate title.
  const markdown = raw.replace(/^#\s+.+\n+/, "");

  return (
    <div className="pt-24">
      <section className="mx-auto max-w-3xl px-6 py-12 md:py-20">
        <div className="mb-10 border-b border-slate-200 pb-6 dark:border-slate-800">
          <h1 className="text-3xl font-bold text-navy-950 sm:text-4xl dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">{subtitle}</p>
          )}
          {generatedNote && (
            <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
              {generatedNote}
            </p>
          )}
        </div>

        <article className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-navy-950 prose-a:text-navy-700 prose-a:no-underline hover:prose-a:underline dark:prose-invert dark:prose-headings:text-white dark:prose-a:text-navy-300">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </article>
      </section>
    </div>
  );
}
