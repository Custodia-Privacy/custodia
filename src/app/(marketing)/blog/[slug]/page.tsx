import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────
// Post data — content rendered as JSX for zero extra deps
// ─────────────────────────────────────────────────────────────

type Post = {
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  readTime: string;
  tags: string[];
  description: string;
  content: React.ReactNode;
};

const posts: Post[] = [
  {
    slug: "gdpr-compliance-small-business",
    title: "GDPR Compliance for Small Business: The 2026 Guide",
    subtitle:
      "Everything you need to know about GDPR compliance — without a legal team or a six-figure budget.",
    date: "March 2026",
    readTime: "10 min read",
    tags: ["GDPR", "Compliance", "Small Business"],
    description:
      "A practical guide to GDPR compliance for small businesses. Covers requirements, common mistakes, a step-by-step checklist, and how to automate compliance.",
    content: (
      <>
        <h2>Why GDPR Matters for Small Businesses</h2>
        <p>
          If your website is accessible to anyone in the European Union — and unless you&apos;ve
          geo-blocked the entire continent, it is — GDPR applies to you. It doesn&apos;t matter if
          you&apos;re a 3-person SaaS startup in Austin or a 15-person e-commerce store in Toronto.
          If you collect personal data from EU residents, you&apos;re subject to GDPR.
        </p>
        <p>
          And the penalties are real. Maximum fines reach €20 million or 4% of annual global
          turnover, whichever is higher. But it&apos;s not just the fines — it&apos;s the
          reputational damage, the legal costs, and the growing trend of individual data subject
          complaints that can trigger investigations.
        </p>
        <p>
          The good news: GDPR compliance for small businesses is achievable. You don&apos;t need a
          dedicated privacy team or a $50,000 enterprise platform. You need to understand what&apos;s
          required, know what your website actually does with visitor data, and put the right systems
          in place.
        </p>

        <h2>What GDPR Actually Requires</h2>
        <p>
          GDPR is built on seven principles. Here&apos;s what each one means in practice for a small
          business:
        </p>

        <h3>1. Lawfulness, Fairness, and Transparency</h3>
        <p>
          You need a legal basis to process personal data. For most small businesses, this means
          either <strong>consent</strong> (the visitor actively agreed) or{" "}
          <strong>legitimate interest</strong> (you have a reasonable business reason, and it
          doesn&apos;t override the person&apos;s rights).
        </p>
        <p>
          <strong>In practice:</strong> Your website needs a cookie consent banner that gets active,
          informed consent before loading non-essential cookies and trackers. &ldquo;By continuing to
          browse, you agree&rdquo; is not valid consent under GDPR.
        </p>

        <h3>2. Purpose Limitation</h3>
        <p>
          You can only use data for the purpose you collected it for. If someone gave you their email
          to download a whitepaper, you can&apos;t automatically add them to your sales newsletter.
        </p>
        <p>
          <strong>In practice:</strong> Be specific in your consent requests. Separate marketing
          consent from functional consent.
        </p>

        <h3>3. Data Minimization</h3>
        <p>
          Only collect what you need. If your contact form asks for a phone number but you never call
          anyone, stop collecting it.
        </p>
        <p>
          <strong>In practice:</strong> Audit your forms, analytics, and third-party tools. Remove
          anything that collects data you don&apos;t use.
        </p>

        <h3>4. Accuracy</h3>
        <p>Keep personal data accurate and up to date.</p>
        <p>
          <strong>In practice:</strong> Give users a way to update their information. If you maintain
          a customer database, have a process for corrections.
        </p>

        <h3>5. Storage Limitation</h3>
        <p>Don&apos;t keep personal data longer than necessary.</p>
        <p>
          <strong>In practice:</strong> Set retention policies. Delete old form submissions, purge
          inactive user accounts (with notice), and configure your analytics to anonymize data after
          a set period.
        </p>

        <h3>6. Integrity and Confidentiality</h3>
        <p>Protect personal data with appropriate security measures.</p>
        <p>
          <strong>In practice:</strong> Use HTTPS. Keep your CMS and plugins updated. Use strong
          passwords and 2FA. If you store customer data, encrypt it at rest.
        </p>

        <h3>7. Accountability</h3>
        <p>
          You need to demonstrate compliance — not just be compliant. Documentation matters.
        </p>
        <p>
          <strong>In practice:</strong> Maintain a record of processing activities (ROPA). Document
          your consent mechanism. Keep records of data subject requests.
        </p>

        <h2>The 5 Most Common GDPR Mistakes Small Businesses Make</h2>

        <h3>1. Relying on an Inadequate Cookie Banner</h3>
        <p>
          The most common mistake: installing a cookie banner that loads all cookies first and then
          shows a notice. GDPR requires opt-in consent. Non-essential cookies — analytics,
          advertising, social media pixels — cannot fire until the visitor actively consents.
        </p>
        <p>
          Many popular cookie banner plugins still get this wrong in 2026. They show a banner, but
          the tracking scripts are already running. That&apos;s not compliance.
        </p>

        <h3>2. Using a Generic Privacy Policy Template</h3>
        <p>
          Template privacy policies are better than nothing, but they often fail to describe your
          actual data practices. If your privacy policy doesn&apos;t mention the specific third-party
          services you use (Google Analytics, Stripe, HubSpot, Meta Pixel, etc.), it&apos;s
          incomplete.
        </p>
        <p>
          GDPR requires you to disclose: what data you collect, why, who you share it with (including
          specific third parties), how long you keep it, and what rights users have. A generic
          template can&apos;t know what your site actually does.
        </p>

        <h3>3. Ignoring Data Subject Access Requests (DSARs)</h3>
        <p>
          Under GDPR, any EU resident can request a copy of all personal data you hold about them,
          ask you to delete it, or request you stop processing it. You have 30 days to respond.
        </p>
        <p>
          Many small businesses don&apos;t have a system for handling these requests. When one
          arrives — and they do — scrambling to figure out where data lives across email, CRM,
          analytics, and payment systems wastes time and risks missing the deadline.
        </p>

        <h3>4. Not Knowing What Trackers Are on Your Site</h3>
        <p>
          This is the foundational problem. Most small business owners don&apos;t have a complete
          picture of what tracking technologies are running on their website. Your developer added
          Google Analytics. Your marketing person added a Meta Pixel. A WordPress plugin added three
          more trackers you&apos;ve never heard of.
        </p>
        <p>If you don&apos;t know what data you&apos;re collecting, you can&apos;t comply with GDPR.</p>

        <h3>5. Treating Compliance as a One-Time Project</h3>
        <p>
          GDPR compliance isn&apos;t a checkbox you tick once. Your website changes. You add new
          tools, new pages, new integrations. Each change can introduce new data collection that needs
          to be disclosed and consented to.
        </p>
        <p>Without ongoing monitoring, compliance degrades over time.</p>

        <h2>A Step-by-Step GDPR Compliance Checklist for Small Businesses</h2>

        <h3>Step 1: Scan Your Website</h3>
        <p>
          Before you can comply, you need to know what data your website collects. Run a
          comprehensive scan that detects all cookies, tracking pixels and scripts, third-party
          services receiving data, local storage usage, and fingerprinting techniques.
        </p>
        <p>This is the foundation everything else builds on.</p>

        <h3>Step 2: Implement a Proper Consent Banner</h3>
        <p>Your consent banner must:</p>
        <ul>
          <li>Block non-essential cookies until consent is given</li>
          <li>Offer granular choices (analytics, marketing, functional)</li>
          <li>Be as easy to reject as to accept (no dark patterns)</li>
          <li>Record proof of consent</li>
          <li>Allow visitors to withdraw consent at any time</li>
          <li>Support Google Consent Mode v2</li>
        </ul>

        <h3>Step 3: Create an Accurate Privacy Policy</h3>
        <p>
          Your privacy policy should be written in plain language, specific to your actual data
          practices, updated whenever your data practices change, and easily accessible from every
          page.
        </p>
        <p>
          It must cover: data controller identity, types of data collected, purposes, legal bases,
          third-party recipients, international transfers, retention periods, and user rights.
        </p>

        <h3>Step 4: Set Up DSAR Handling</h3>
        <p>
          Create a process for handling data subject requests: designate someone to receive requests,
          create a public intake form, document where personal data lives, set up deadline tracking
          (30 days), and prepare response templates.
        </p>

        <h3>Step 5: Document Your Data Processing</h3>
        <p>
          Create a Record of Processing Activities (ROPA) that lists each category of data you
          process, the purpose and legal basis, categories of data subjects, who you share data with,
          retention periods, and security measures.
        </p>

        <h3>Step 6: Monitor Continuously</h3>
        <p>
          Set up a system to re-scan your website regularly (weekly is ideal), alert you when new
          trackers appear, flag when your privacy policy falls out of date, and track regulatory
          changes.
        </p>

        <h2>How Custodia Automates GDPR Compliance</h2>
        <p>
          Most of the steps above require either specialized expertise or significant manual effort.
          That&apos;s where Custodia comes in.
        </p>
        <p>
          Custodia is an AI-powered privacy compliance platform built specifically for small
          businesses. It automates scanning, generates consent banners from your actual scan data,
          creates jurisdiction-aware privacy policies, manages DSARs with AI-assisted data discovery,
          and monitors compliance weekly.
        </p>
        <p>Plans start at $29/month — a fraction of what a privacy consultant would charge for a single audit.</p>
      </>
    ),
  },
  {
    slug: "ai-privacy-policy-generator",
    title: "AI Privacy Policy Generator: How It Works and Why Templates Fall Short",
    subtitle:
      "Your privacy policy should describe what your website actually does — not what a template guesses it might do.",
    date: "March 2026",
    readTime: "8 min read",
    tags: ["Privacy Policy", "AI", "GDPR", "CCPA"],
    description:
      "How AI privacy policy generators work and why template-based policies leave you exposed. Covers the scanning process, AI classification, and what to look for in a solution.",
    content: (
      <>
        <h2>The Problem with Privacy Policy Templates</h2>
        <p>
          Most small businesses create their privacy policy the same way: find a free template
          online, fill in the blanks, paste it onto a /privacy page, and move on.
        </p>
        <p>
          It makes sense. Privacy policies feel like a legal formality — something you need to have
          but nobody reads. Why spend more than 15 minutes on it?
        </p>
        <p>
          Here&apos;s why: under GDPR, CCPA, and the growing patchwork of state privacy laws, your
          privacy policy is a legal document with teeth. It must accurately describe your actual data
          collection and processing practices. If it says you collect X but you actually collect X,
          Y, and Z, that&apos;s a compliance violation.
        </p>
        <p>And templates, by definition, can&apos;t know what your website actually does.</p>

        <h3>Where Templates Go Wrong</h3>

        <h4>1. They&apos;re generic by design</h4>
        <p>
          A template asks you to fill in your company name and check a few boxes. It doesn&apos;t
          know that you&apos;re running Google Analytics 4 with cross-domain tracking, that your chat
          widget sends data to a server in Ireland, or that your payment processor stores customer
          emails for fraud detection.
        </p>
        <p>
          These details matter. GDPR requires you to disclose specific third-party recipients, the
          legal basis for each type of processing, and where data is transferred internationally.
        </p>

        <h4>2. They go stale immediately</h4>
        <p>
          Your website changes constantly. New marketing tools get added. A developer integrates a
          new analytics service. A WordPress plugin update adds a tracker. Your privacy policy —
          written from a template six months ago — says nothing about any of it.
        </p>
        <p>
          Under GDPR, an inaccurate privacy policy is worse than a missing one, because it actively
          misleads visitors about what happens to their data.
        </p>

        <h4>3. They don&apos;t cover jurisdiction-specific requirements</h4>
        <p>
          GDPR, CCPA/CPRA, Virginia&apos;s VCDPA, Colorado&apos;s CPA, Connecticut&apos;s CTDPA,
          and a growing list of state laws each have specific disclosure requirements. A
          one-size-fits-all template rarely hits all of them.
        </p>

        <h4>4. They create a false sense of security</h4>
        <p>
          The most dangerous thing about a template privacy policy is that it makes you think
          you&apos;re compliant when you&apos;re not. You checked the box, you have a policy, so you
          must be covered. Until a DSAR comes in and you realize your policy doesn&apos;t mention
          half the data you&apos;re collecting.
        </p>

        <h2>How AI Privacy Policy Generation Works</h2>
        <p>
          An AI privacy policy generator takes a fundamentally different approach. Instead of
          starting from a generic template and asking you to fill in blanks, it starts from your
          actual data.
        </p>

        <h3>Step 1: Website Scanning</h3>
        <p>
          An AI-powered scanner crawls your website in a headless browser — exactly like a real
          visitor would. It loads every page, triggers JavaScript, and watches what happens. It
          detects all cookies, tracking pixels, third-party scripts, local storage usage, and data
          transfers.
        </p>

        <h3>Step 2: AI Classification</h3>
        <p>
          Raw scan data alone isn&apos;t enough. The AI classifies each detected element: what type
          of data does this tracker collect, what&apos;s the purpose, who&apos;s the third party, and
          what&apos;s the appropriate legal basis under GDPR.
        </p>
        <p>
          This classification step is where AI dramatically outperforms templates. A template
          doesn&apos;t know that the <code>_fbp</code> cookie belongs to Meta and is used for
          advertising. The AI does — and it can explain that in plain English in your privacy policy.
        </p>

        <h3>Step 3: Policy Generation</h3>
        <p>
          With classified scan data in hand, the AI generates a complete privacy policy that lists
          every type of personal data you collect, explains the purpose in plain language, names
          specific third-party services, identifies legal bases, covers international transfers, and
          includes jurisdiction-specific disclosures.
        </p>

        <h3>Step 4: Ongoing Updates</h3>
        <p>
          This is where AI generation truly separates from templates. When your website changes — a
          new tracker appears, a service is removed, a page adds a form — the system re-scans,
          re-classifies, and updates your privacy policy automatically.
        </p>

        <h2>Template vs. AI-Generated: A Side-by-Side Comparison</h2>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Aspect</th>
                <th>Template Policy</th>
                <th>AI-Generated Policy</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Data sources</td>
                <td>Your memory and guesses</td>
                <td>Actual website scan data</td>
              </tr>
              <tr>
                <td>Third-party disclosure</td>
                <td>Generic categories</td>
                <td>Specific services by name</td>
              </tr>
              <tr>
                <td>Updates</td>
                <td>Manual — whenever you remember</td>
                <td>Automatic — triggered by scan changes</td>
              </tr>
              <tr>
                <td>Jurisdiction coverage</td>
                <td>Usually 1–2 frameworks</td>
                <td>GDPR, CCPA, and applicable state laws</td>
              </tr>
              <tr>
                <td>Time to create</td>
                <td>30–60 minutes of guesswork</td>
                <td>2 minutes of automated analysis</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>What to Look for in an AI Privacy Policy Generator</h2>

        <h3>Must-Haves</h3>
        <ul>
          <li>
            <strong>Real website scanning</strong> — The AI should crawl your actual site, not just
            ask you questions.
          </li>
          <li>
            <strong>Tracker classification</strong> — The tool should identify what each tracker
            does, not just list cookie names.
          </li>
          <li>
            <strong>Multi-jurisdiction support</strong> — At minimum, GDPR and CCPA.
          </li>
          <li>
            <strong>Automatic updates</strong> — When your site changes, your policy should update
            without manual effort.
          </li>
          <li>
            <strong>Plain language output</strong> — A privacy policy nobody can read doesn&apos;t
            help anyone.
          </li>
        </ul>

        <h2>How Custodia&apos;s AI Privacy Policy Generator Works</h2>
        <p>
          Custodia scans your website, classifies every finding by purpose, data type, and legal
          basis, then generates a complete jurisdiction-aware privacy policy in plain English.
          When your site changes, your policy updates automatically.
        </p>
        <p>
          Your privacy policy, consent banner, and compliance dashboard all draw from the same scan
          data — everything stays in sync without manual effort.
        </p>
      </>
    ),
  },
  {
    slug: "cookie-consent-management-tool",
    title: "Cookie Consent Management: Beyond the Banner",
    subtitle:
      "A cookie banner is not a consent management solution. Here's what you actually need — and how to get there without enterprise pricing.",
    date: "March 2026",
    readTime: "9 min read",
    tags: ["Cookie Consent", "GDPR", "Google Consent Mode"],
    description:
      "Why most cookie banners fail GDPR and what real consent management requires. Covers GDPR vs CCPA differences, Google Consent Mode v2, and what to look for in a solution.",
    content: (
      <>
        <h2>The Cookie Banner Illusion</h2>
        <p>
          Here&apos;s a scenario that plays out thousands of times a day: a small business owner
          installs a cookie consent banner plugin, sees the popup appear on their site, and checks
          &ldquo;GDPR compliance&rdquo; off their list.
        </p>
        <p>Except they&apos;re probably not compliant.</p>
        <p>
          A cookie banner — the popup that says &ldquo;This site uses cookies&rdquo; with an Accept
          button — is the visible tip of a much larger iceberg. Real consent management involves
          detecting every cookie and tracker, blocking non-essential ones until consent is given,
          categorizing them, recording proof of consent, honoring consent choices, allowing
          withdrawal, syncing with Google Consent Mode v2, and adapting to the visitor&apos;s
          jurisdiction.
        </p>
        <p>
          Most cookie banner tools handle maybe two or three of these. That&apos;s why &ldquo;we
          have a cookie banner&rdquo; and &ldquo;we have proper consent management&rdquo; are very
          different statements.
        </p>

        <h2>What GDPR Actually Requires for Cookie Consent</h2>
        <p>GDPR&apos;s consent requirements are specific and strict. Valid consent must be:</p>

        <h3>Freely Given</h3>
        <p>
          The visitor must have a genuine choice. &ldquo;Accept All&rdquo; and &ldquo;Reject
          All&rdquo; must be equally prominent — no hiding the reject option behind a &ldquo;Manage
          Preferences&rdquo; link with three more clicks. Access to your website cannot be
          contingent on accepting cookies. Pre-checked boxes don&apos;t count as consent.
        </p>

        <h3>Specific</h3>
        <p>
          Consent must be given for each distinct purpose. Your banner should separate strictly
          necessary cookies (no consent needed), analytics cookies, marketing cookies, and functional
          cookies.
        </p>

        <h3>Informed</h3>
        <p>
          Before consenting, the visitor needs to know what cookies you&apos;re using, what data
          they collect, who receives that data, how long the cookies persist, and how to withdraw
          consent later.
        </p>

        <h3>Unambiguous</h3>
        <p>
          Consent requires a clear affirmative action. Scrolling, continuing to browse, or closing
          the banner doesn&apos;t count. The visitor must actively click a consent button.
        </p>

        <h3>Demonstrable</h3>
        <p>
          You need to prove that consent was given. That means logging when consent was given, what
          was consented to, how consent was given, and the visitor&apos;s jurisdiction at the time.
        </p>

        <h2>GDPR vs. CCPA: Different Models, Different Requirements</h2>

        <h3>GDPR: Opt-In</h3>
        <p>
          Under GDPR, non-essential cookies cannot be set until the visitor actively opts in. No
          consent = no cookies. This is the stricter model.
        </p>

        <h3>CCPA: Opt-Out</h3>
        <p>
          Under CCPA/CPRA, you can set cookies by default but must give California residents the
          ability to opt out of the &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; of their personal
          information. This means you need a &ldquo;Do Not Sell or Share My Personal
          Information&rdquo; link.
        </p>

        <h3>The Practical Challenge</h3>
        <p>
          If your website serves visitors from both regions — and most websites do — you need a
          consent mechanism that adapts based on the visitor&apos;s location. This jurisdiction-aware
          behavior is something most basic cookie banner tools simply don&apos;t offer.
        </p>

        <h2>Google Consent Mode v2: Why It Matters</h2>
        <p>
          In 2024, Google made Consent Mode v2 a requirement for advertisers using Google Ads with
          audiences from the European Economic Area. If you run Google Ads and target EU users, this
          isn&apos;t optional.
        </p>

        <h3>What Consent Mode Does</h3>
        <p>
          Google Consent Mode is a framework that lets your consent banner communicate with Google
          tags (Analytics, Ads, etc.). Instead of simply blocking or allowing Google scripts,
          Consent Mode tells them the user&apos;s consent status for{" "}
          <code>ad_storage</code>, <code>analytics_storage</code>,{" "}
          <code>ad_user_data</code>, and <code>ad_personalization</code>.
        </p>

        <h3>Why It Matters for Small Businesses</h3>
        <p>
          Without Consent Mode v2, your Google Analytics data from EU users will have gaps, your
          remarketing audiences won&apos;t build properly, and you may lose access to certain Google
          Ads features. With it, Google adjusts its behavior based on consent status and you still
          get modeled analytics data even when users don&apos;t consent.
        </p>

        <h2>What a Real Consent Management Solution Looks Like</h2>
        <ol>
          <li>
            <strong>Automatic scanner</strong> — Crawls your website and discovers all cookies and
            trackers. You shouldn&apos;t have to manually list every cookie.
          </li>
          <li>
            <strong>Script blocking engine</strong> — Non-essential scripts must be blocked before
            consent is given, not just hidden while they load anyway.
          </li>
          <li>
            <strong>Jurisdiction detection</strong> — The banner adapts based on where the visitor
            is located.
          </li>
          <li>
            <strong>Granular consent categories</strong> — Visitors should be able to consent to
            analytics but not marketing.
          </li>
          <li>
            <strong>Consent record storage</strong> — Every consent event logged with timestamp,
            choices, and jurisdiction.
          </li>
          <li>
            <strong>Google Consent Mode v2 integration</strong> — Essential for any business running
            Google Analytics or Ads.
          </li>
          <li>
            <strong>Withdrawal mechanism</strong> — Visitors must be able to change their consent
            preferences at any time.
          </li>
          <li>
            <strong>Sync with privacy policy</strong> — Your banner and privacy policy should tell
            the same story.
          </li>
        </ol>

        <h2>The Cost Problem</h2>
        <p>
          Enterprise consent management platforms like OneTrust and Cookiebot Pro deliver most of
          these capabilities. But the pricing reflects their enterprise focus:
        </p>
        <ul>
          <li>
            <strong>OneTrust</strong>: Custom pricing, typically $5,000–$50,000+/year
          </li>
          <li>
            <strong>Cookiebot CMP</strong>: €12–€40/month basic, escalating quickly for advanced
            features
          </li>
          <li>
            <strong>TrustArc</strong>: Enterprise pricing, typically $10,000+/year
          </li>
        </ul>
        <p>
          For a 10-person SaaS startup or a small e-commerce store, these prices are hard to justify.
        </p>

        <h2>How Custodia Handles Cookie Consent Management</h2>
        <p>
          Custodia takes a different approach: consent management as part of a complete privacy
          compliance platform, priced for small businesses.
        </p>
        <p>
          Custodia&apos;s consent banner is generated from an actual scan of your website — not
          configured from a template. It detects every cookie and tracker, classifies them by
          purpose, and the banner reflects exactly what&apos;s on your site. It&apos;s
          jurisdiction-aware, supports Google Consent Mode v2 out of the box, and stays in sync with
          your privacy policy automatically.
        </p>
        <p>Custodia Starter includes full consent management at $29/month.</p>
      </>
    ),
  },
];

// ─────────────────────────────────────────────────────────────
// Static params
// ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} — Custodia Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: "2026-03-01",
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 pt-28 pb-20">
      {/* Back */}
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-navy-950 dark:hover:text-white"
      >
        ← Back to Blog
      </Link>

      {/* Header */}
      <header className="mb-10">
        <div className="mb-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-navy-950 dark:text-white sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">{post.subtitle}</p>
        <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
          <span>{post.date}</span>
          <span>·</span>
          <span>{post.readTime}</span>
        </div>
      </header>

      {/* Content */}
      <article className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-navy-950 dark:prose-headings:text-white prose-a:text-navy-700 dark:prose-a:text-navy-400 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-sm dark:prose-code:bg-slate-800 prose-li:my-1 prose-table:text-sm">
        {post.content}
      </article>

      {/* CTA */}
      <div className="mt-16 rounded-2xl bg-navy-950 px-8 py-10 text-center dark:bg-navy-900">
        <h2 className="text-2xl font-bold text-white">
          See what your website is actually collecting
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

      {/* More posts */}
      <div className="mt-12">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          More from the blog
        </h3>
        <div className="space-y-3">
          {posts
            .filter((p) => p.slug !== slug)
            .map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="block rounded-lg border border-slate-200 p-4 text-sm font-medium text-navy-950 transition-colors hover:border-navy-300 hover:text-navy-700 dark:border-slate-800 dark:text-white dark:hover:border-navy-600"
              >
                {p.title}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
