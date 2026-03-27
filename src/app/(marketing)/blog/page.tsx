import type { Metadata } from "next";
import Link from "next/link";
import { BlogEmailCapture } from "@/components/marketing/blog-email-capture";

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
  {
    slug: "ccpa-compliance-small-business",
    title: "CCPA Compliance for Small Business: The 2026 Guide",
    excerpt:
      "Everything you need to know about California's privacy law — and the 2023 CPRA updates — without a law degree.",
    date: "March 2026",
    readTime: "12 min read",
    tags: ["CCPA", "Compliance", "Small Business", "Privacy"],
  },
  {
    slug: "google-consent-mode-v2",
    title: "Google Consent Mode v2: What It Is, Why It's Mandatory, and How to Implement It",
    excerpt:
      "Google made Consent Mode v2 mandatory for EU advertisers in 2024. Here's everything small businesses need to know.",
    date: "March 2026",
    readTime: "11 min read",
    tags: ["Google Analytics", "Consent", "GDPR", "Small Business"],
  },
  {
    slug: "dsar-guide-small-business",
    title: "Data Subject Access Requests (DSARs): A Small Business Survival Guide",
    excerpt:
      "Someone just emailed asking for all the data you hold on them. Here's exactly what to do — and how to avoid the mistakes that turn a routine request into a regulatory headache.",
    date: "March 2026",
    readTime: "11 min read",
    tags: ["GDPR", "Privacy", "Compliance", "Small Business"],
  },
  {
    slug: "us-state-privacy-laws-guide",
    title: "US State Privacy Laws: What Small Businesses Need to Know in 2026",
    excerpt:
      "GDPR and CCPA were just the beginning. Here's how to navigate 15+ state privacy laws without building 15 separate compliance programs.",
    date: "March 2026",
    readTime: "11 min read",
    tags: ["Privacy", "Compliance", "Small Business", "CCPA"],
  },
  {
    slug: "gdpr-for-saas-companies",
    title: "GDPR for SaaS Companies: The Founder's Compliance Guide (2026)",
    excerpt:
      "GDPR hits SaaS companies differently. You're a data processor for customers AND a data controller for your own site. Here's what founders need to do.",
    date: "March 2026",
    readTime: "12 min read",
    tags: ["GDPR", "SaaS", "Privacy", "Startup"],
  },
  {
    slug: "privacy-compliance-ecommerce",
    title: "E-Commerce Privacy Compliance: The Complete Guide for Online Store Owners",
    excerpt:
      "Shopify and WooCommerce stores collect more personal data than most websites. Here's how to handle Meta Pixel consent, abandoned cart emails, and DSARs legally.",
    date: "March 2026",
    readTime: "12 min read",
    tags: ["E-Commerce", "Privacy", "GDPR", "Small Business"],
  },
  {
    slug: "website-privacy-audit-checklist",
    title: "Website Privacy Audit Checklist: 30 Things to Verify Before Your Next Compliance Review",
    excerpt:
      "A 30-item checklist covering cookies, consent banners, privacy policy, DSAR handling, and ongoing monitoring — use it to self-audit before hiring a consultant.",
    date: "March 2026",
    readTime: "10 min read",
    tags: ["Privacy", "Compliance", "GDPR", "Web Dev"],
  },
  {
    slug: "onetrust-alternative-small-business",
    title: "OneTrust Alternative for Small Business: 5 Options That Won't Overcharge You",
    excerpt:
      "OneTrust is built for enterprise legal teams. If you're a small business owner, you need something that works in 30 minutes — not a six-month implementation project. Here's an honest comparison of five alternatives.",
    date: "March 2026",
    readTime: "8 min read",
    tags: ["Privacy", "Compliance", "GDPR", "SaaS"],
  },
  {
    slug: "cookiebot-alternative",
    title: "Cookiebot Alternative: 5 Cookie Consent Tools That Don't Lock You Into Usercentrics Pricing",
    excerpt:
      "Cookiebot is a solid consent banner — but if you're paying per pageview and still need a privacy policy and DSAR handling, you're only getting one piece of a bigger puzzle.",
    date: "March 2026",
    readTime: "7 min read",
    tags: ["Privacy", "GDPR", "Compliance", "SaaS"],
  },
  {
    slug: "google-analytics-4-gdpr-compliance",
    title: "Google Analytics 4 and GDPR: How to Set Up GA4 Correctly for EU Users",
    excerpt:
      "Is Google Analytics 4 GDPR-compliant? Not out of the box — but it can be. This guide walks through the five configuration changes that matter, where to find each setting, and what you risk if you skip them.",
    date: "March 2026",
    readTime: "9 min read",
    tags: ["Privacy", "GDPR", "Analytics", "Web Dev"],
  },
  {
    slug: "wordpress-gdpr-compliance",
    title: "WordPress GDPR Compliance: The Complete 2026 Guide",
    excerpt:
      "WordPress makes it easy to build a website — and surprisingly easy to accidentally violate GDPR. This guide walks through every fix: plugins, consent, privacy policy, WooCommerce, and DSARs.",
    date: "March 2026",
    readTime: "11 min read",
    tags: ["WordPress", "GDPR", "Compliance", "Privacy"],
  },
  {
    slug: "shopify-gdpr-compliance",
    title: "Shopify GDPR Compliance: What Every Store Owner Needs to Know in 2026",
    excerpt:
      "Shopify handles payments and hosting — but GDPR compliance is still your responsibility. Here's what Shopify does for you, what it doesn't, and the five steps to get your store compliant.",
    date: "March 2026",
    readTime: "10 min read",
    tags: ["Shopify", "GDPR", "E-Commerce", "Compliance"],
  },
  {
    slug: "gdpr-fines-list",
    title: "GDPR Fines: The 2026 List of Biggest Penalties and What They Mean for Small Businesses",
    excerpt:
      "GDPR fines have passed €4.5 billion since enforcement began. Here's what the biggest cases have in common, what small businesses actually get fined for, and how to check if you're at risk.",
    date: "March 2026",
    readTime: "9 min read",
    tags: ["GDPR", "Compliance", "Privacy", "Small Business"],
  },
  {
    slug: "data-processing-agreement-gdpr",
    title: "Data Processing Agreement (DPA): What It Is, Who Needs One, and What to Include",
    excerpt:
      "If you use any SaaS tool that handles customer data, you probably need a Data Processing Agreement. Here's what a DPA must include, who to get them from, and how to audit your current setup.",
    date: "March 2026",
    readTime: "8 min read",
    tags: ["GDPR", "Compliance", "Privacy", "Legal"],
  },
  {
    slug: "gdpr-us-companies",
    title: "GDPR for US Companies: Does It Apply to You and What Do You Need to Do?",
    excerpt:
      "GDPR doesn't care where your company is based. If you have visitors or customers in the EU, it applies to you. Here's how to tell if you're in scope and the five things to do first.",
    date: "March 2026",
    readTime: "8 min read",
    tags: ["GDPR", "Compliance", "Privacy", "Small Business"],
  },
  {
    slug: "gdpr-data-breach-notification",
    title: "GDPR Data Breach Notification: What to Do in the First 72 Hours",
    excerpt:
      "GDPR gives you 72 hours to notify your supervisory authority after discovering a data breach. Here's exactly what to do, what to report, and how to avoid the most common mistakes.",
    date: "March 2026",
    readTime: "8 min read",
    tags: ["GDPR", "Data Breach", "Compliance", "Security"],
  },
  {
    slug: "gdpr-legitimate-interest",
    title: "Legitimate Interest Under GDPR: When You Can Use It and When You Can't",
    excerpt:
      "Legitimate interest is the most flexible lawful basis under GDPR — and the most misused. Here's how the three-part test works, where it fails, and how to document a legitimate interests assessment.",
    date: "March 2026",
    readTime: "9 min read",
    tags: ["GDPR", "Compliance", "Privacy", "Legal"],
  },
  {
    slug: "privacy-policy-generator",
    title: "Privacy Policy Generator: Why Free Templates Fall Short and What to Use Instead",
    excerpt:
      "Free privacy policy generators produce boilerplate that doesn't describe what your website actually does. Here's why the specifics matter and how to generate a policy that reflects your real data practices.",
    date: "March 2026",
    readTime: "7 min read",
    tags: ["Privacy Policy", "GDPR", "Compliance", "Tools"],
  },
  {
    slug: "gdpr-vs-ccpa",
    title: "GDPR vs CCPA: Key Differences Every Business Needs to Know",
    excerpt:
      "GDPR and CCPA both protect consumer privacy — but they work differently. A clear comparison of consent models, individual rights, fines, and what you need to do if you have both EU and California users.",
    date: "March 2026",
    readTime: "9 min read",
    tags: ["GDPR", "CCPA", "Compliance", "Privacy"],
  },
  {
    slug: "gdpr-right-to-erasure",
    title: "GDPR Right to Erasure: What \"The Right to Be Forgotten\" Actually Requires",
    excerpt:
      "The right to be forgotten sounds absolute. It isn't. GDPR's right to erasure has specific conditions, specific exceptions, and a 30-day deadline. Here's what you actually need to do when someone asks you to delete their data.",
    date: "March 2026",
    readTime: "8 min read",
    tags: ["GDPR", "Compliance", "Privacy", "DSARs"],
  },
  {
    slug: "email-marketing-gdpr-consent",
    title: "Email Marketing and GDPR: What Consent Actually Means (and What Doesn't Count)",
    excerpt:
      "Buying a list violates GDPR. Pre-checking a consent box violates GDPR. Sending marketing emails to people who signed up for something else violates GDPR. Here's what valid email consent actually looks like.",
    date: "March 2026",
    readTime: "8 min read",
    tags: ["GDPR", "Email Marketing", "Compliance", "Consent"],
  },
  {
    slug: "privacy-by-design-gdpr",
    title: "Privacy by Design: The GDPR Principle That Affects How You Build Products",
    excerpt:
      "Privacy by design isn't a buzzword — it's a legal requirement under GDPR Article 25. Here's what it means in practice, the 7 foundational principles, and a checklist for auditing your product.",
    date: "March 2026",
    readTime: "8 min read",
    tags: ["GDPR", "Privacy", "SaaS", "Product"],
  },
  {
    slug: "wix-gdpr-compliance",
    title: "Wix GDPR Compliance: What the Platform Does and What You Still Need to Handle",
    excerpt:
      "Wix is GDPR-compliant as a platform. Your Wix site may not be. Here's what Wix handles, what it doesn't, and the five steps to make your site compliant.",
    date: "March 2026",
    readTime: "8 min read",
    tags: ["Wix", "GDPR", "Compliance", "Privacy"],
  },
  {
    slug: "squarespace-gdpr-compliance",
    title: "Squarespace GDPR Compliance: A Practical Guide for Site Owners",
    excerpt:
      "Squarespace handles its own compliance obligations as a processor. Your Squarespace site's compliance depends on how you configure it. Here's what to check and fix.",
    date: "March 2026",
    readTime: "8 min read",
    tags: ["Squarespace", "GDPR", "Compliance", "Privacy"],
  },
  {
    slug: "hubspot-gdpr-compliance",
    title: "HubSpot GDPR Compliance: Configuring Your CRM and Marketing Tools Correctly",
    excerpt:
      "HubSpot has GDPR features built in. Most users don't configure them correctly. Here's which settings actually matter, how to set the right legal basis, and what HubSpot doesn't handle for you.",
    date: "March 2026",
    readTime: "9 min read",
    tags: ["HubSpot", "GDPR", "CRM", "Compliance"],
  },
  {
    slug: "facebook-pixel-gdpr",
    title: "Facebook Pixel and GDPR: How to Use Meta Pixel Without Violating Privacy Law",
    excerpt:
      "Meta Pixel is one of the most common sources of GDPR violations. It fires before consent by default, transfers data to US servers, and links behavioral data to Facebook identity. Here's how to run it compliantly.",
    date: "March 2026",
    readTime: "8 min read",
    tags: ["GDPR", "Meta Pixel", "Advertising", "Compliance"],
  },
  {
    slug: "hotjar-gdpr-compliance",
    title: "Hotjar and GDPR: Is Session Recording Legal and How to Configure It Correctly",
    excerpt:
      "Session recording captures everything a user does — including what they type. Hotjar can be GDPR-compliant, but the default configuration almost certainly isn't. Here's what to fix.",
    date: "March 2026",
    readTime: "8 min read",
    tags: ["Hotjar", "GDPR", "Analytics", "Compliance"],
  },
  {
    slug: "mailchimp-gdpr-compliance",
    title: "Mailchimp and GDPR: What You Actually Need to Do for Compliance",
    excerpt:
      "Mailchimp is GDPR-compliant as a platform. Whether your Mailchimp account is being used compliantly is a different question. Here are the 5 settings that matter and how to build your list correctly.",
    date: "March 2026",
    readTime: "8 min read",
    tags: ["Mailchimp", "GDPR", "Email Marketing", "Compliance"],
  },
  {
    slug: "gdpr-for-startups",
    title: "GDPR for Startups: A Founder's Compliance Roadmap (Without a Legal Team)",
    excerpt:
      "Most startup founders know they need GDPR compliance but have no idea where to start. This is the practical roadmap — five phases, in order, without a legal team.",
    date: "March 2026",
    readTime: "9 min read",
    tags: ["GDPR", "Startups", "Compliance", "Founders"],
  },
  {
    slug: "gdpr-for-nonprofits",
    title: "GDPR for Nonprofits: A Plain-English Compliance Guide",
    excerpt: "Nonprofits collect donor, volunteer, and beneficiary data — all covered by GDPR. Here's what your organisation must do to comply.",
    date: "March 27, 2026",
    readTime: "9 min read",
    tags: ["GDPR", "Nonprofits"],
  },
  {
    slug: "cookie-policy-template",
    title: "Cookie Policy Template: What to Include (And What Most Get Wrong)",
    excerpt: "Most cookie policies are copied templates that don't reflect your actual cookies. Here's what a proper cookie policy requires — and how to get it right.",
    date: "March 27, 2026",
    readTime: "8 min read",
    tags: ["Cookies", "GDPR", "Templates"],
  },
  {
    slug: 'gdpr-for-freelancers',
    title: 'GDPR for Freelancers: What Self-Employed People Actually Need to Do',
    excerpt: 'Freelancers aren\'t exempt from GDPR. If you have a website, send newsletters, or process client data, here\'s what you must do.',
    date: 'March 27, 2026',
    readTime: '8 min read',
    tags: ['GDPR', 'Freelancers'],
  },
  {
    slug: 'intercom-gdpr-compliance',
    title: 'Intercom and GDPR: What You Must Configure Before Going Live',
    excerpt: 'Intercom processes visitor data, chat history, and behavioral events. Here\'s what GDPR requires before you deploy it on your site.',
    date: 'March 27, 2026',
    readTime: '9 min read',
    tags: ['GDPR', 'Intercom', 'Tools'],
  },
  {
    slug: 'stripe-gdpr-compliance',
    title: 'Stripe and GDPR: What Every Business Using Stripe Needs to Know',
    excerpt: 'Stripe is a data processor for EU payment data. Here\'s the full GDPR checklist: DPA, privacy policy disclosure, deletion requests, and what Stripe retains.',
    date: 'March 27, 2026',
    readTime: '9 min read',
    tags: ['GDPR', 'Stripe', 'Payments'],
  },
  {
    slug: 'gdpr-consent-management',
    title: 'GDPR Consent Management: What Valid Consent Actually Looks Like',
    excerpt: 'Pre-ticked boxes, bundled consent, and cookie walls all fail GDPR. Here\'s what Article 7 actually requires for valid consent.',
    date: 'March 27, 2026',
    readTime: '10 min read',
    tags: ['GDPR', 'Consent', 'Compliance'],
  },
  {
    slug: 'pipeda-compliance-guide',
    title: 'PIPEDA Compliance: Canada\'s Privacy Law Explained for Businesses',
    excerpt: 'PIPEDA applies to Canadian businesses and anyone processing Canadian personal data. Here\'s what the law requires and how to comply.',
    date: 'March 27, 2026',
    readTime: '9 min read',
    tags: ['PIPEDA', 'Privacy', 'Canada'],
  },
  {
    slug: 'gdpr-data-retention-policy',
    title: 'GDPR Data Retention: How Long Can You Keep Personal Data?',
    excerpt: 'Storage limitation is one of GDPR\'s most violated principles. Here\'s how to set retention periods by data category and enforce them in practice.',
    date: 'March 27, 2026',
    readTime: '9 min read',
    tags: ['GDPR', 'Data Retention', 'Compliance'],
  },
  {
    slug: 'gdpr-third-party-vendors',
    title: 'GDPR and Third-Party Vendors: Managing Data Processor Relationships',
    excerpt: 'Every SaaS tool you use may be a GDPR data processor. Here\'s how to audit your vendors, sign DPAs, and build a compliant processor management process.',
    date: 'March 27, 2026',
    readTime: '10 min read',
    tags: ['GDPR', 'Vendors', 'DPA'],
  },
  {
    slug: 'privacy-impact-assessment',
    title: 'Privacy Impact Assessment (PIA): When You Need One and How to Do It',
    excerpt: 'GDPR mandates DPIAs for high-risk processing. Here\'s when one is legally required, what it must contain, and a practical 7-step process.',
    date: 'March 27, 2026',
    readTime: '10 min read',
    tags: ['GDPR', 'DPIA', 'Compliance'],
  },
  {
    slug: 'uk-gdpr-compliance',
    title: 'UK GDPR: What\'s Different After Brexit and What Businesses Must Do',
    excerpt: 'Brexit created a parallel UK GDPR framework. Here\'s what changed, what stayed the same, and what businesses serving UK users must do to comply.',
    date: 'March 27, 2026',
    readTime: '9 min read',
    tags: ['UK GDPR', 'Brexit', 'Privacy'],
  },
  {
    slug: 'gdpr-for-agencies',
    title: 'GDPR for Agencies: How Digital, Marketing, and Web Agencies Must Comply',
    excerpt: 'Agencies are simultaneously data controllers and processors. Here\'s what GDPR requires from both roles — and how compliance can become a competitive advantage.',
    date: 'March 27, 2026',
    readTime: '9 min read',
    tags: ['GDPR', 'Agencies', 'Marketing'],
  },
  {
    slug: 'gdpr-penalties-guide',
    title: 'GDPR Penalties: How Fines Are Calculated and How to Reduce Your Risk',
    excerpt: 'GDPR fines can reach €20M or 4% of turnover — but how are they actually calculated? Here\'s how DPAs determine penalties and what reduces your risk.',
    date: 'March 27, 2026',
    readTime: '10 min read',
    tags: ['GDPR', 'Fines', 'Enforcement'],
  },
  {
    slug: 'gdpr-records-of-processing-activities',
    title: 'GDPR Records of Processing Activities (RoPA): What to Include and How to Maintain Them',
    excerpt: 'Article 30 requires most organisations to maintain a Record of Processing Activities. Here\'s who needs one, what it must contain, and how to build yours.',
    date: 'March 27, 2026',
    readTime: '9 min read',
    tags: ['GDPR', 'RoPA', 'Compliance'],
  },
  {
    slug: 'gdpr-data-portability',
    title: 'GDPR Data Portability: What Article 20 Requires and How to Implement It',
    excerpt: 'Article 20 gives users the right to their data in a machine-readable format. Here\'s when it applies, what format to use, and how to build a compliant export.',
    date: 'March 27, 2026',
    readTime: '8 min read',
    tags: ['GDPR', 'Data Rights', 'Compliance'],
  },
  {
    slug: 'gdpr-marketing-emails',
    title: 'GDPR and Marketing Emails: The Complete Guide to Compliant Campaigns',
    excerpt: 'Email marketing is one of the most common GDPR violation areas. Here\'s the complete guide to consent, legitimate interest, unsubscribes, and list hygiene.',
    date: 'March 27, 2026',
    readTime: '10 min read',
    tags: ['GDPR', 'Email Marketing', 'Consent'],
  },
  {
    slug: 'website-privacy-policy-guide',
    title: 'Website Privacy Policy: What It Must Contain in 2026',
    excerpt: 'Most privacy policies are useless templates. Here\'s what a compliant website privacy policy must contain under GDPR, CCPA, and CalOPPA in 2026.',
    date: 'March 27, 2026',
    readTime: '9 min read',
    tags: ['Privacy Policy', 'GDPR', 'CCPA'],
  },
  {
    slug: 'gdpr-employee-data',
    title: 'GDPR and Employee Data: What Employers Must Do to Stay Compliant',
    excerpt: 'Employee data is personal data. Here\'s what GDPR requires employers to do — from HR records and monitoring to health data and deletion requests.',
    date: 'March 27, 2026',
    readTime: '10 min read',
    tags: ['GDPR', 'HR', 'Employee Data'],
  },
  {
    slug: 'gdpr-b2b-saas',
    title: 'GDPR for B2B SaaS: The Controller-Processor Relationship Explained',
    excerpt: 'B2B SaaS companies are processors for their customers and controllers for themselves. Here\'s what both roles require under GDPR — and how to get your DPA right.',
    date: 'March 27, 2026',
    readTime: '10 min read',
    tags: ['GDPR', 'SaaS', 'B2B'],
  },
  {
    slug: 'gdpr-data-mapping',
    title: 'GDPR Data Mapping: How to Build Your Data Inventory',
    excerpt: 'Data mapping is the foundation of GDPR compliance. You can\'t write an accurate privacy policy or respond to DSARs without knowing what data you have and where it lives.',
    date: 'March 27, 2026',
    readTime: '9 min read',
    tags: ['GDPR', 'Data Mapping', 'Compliance'],
  },
  {
    slug: 'gdpr-healthcare',
    title: 'GDPR in Healthcare: What Medical Practices and Health Tech Companies Must Do',
    excerpt: 'Health data is special category data under GDPR. Here\'s what medical practices, health tech startups, and wellness apps must do to comply.',
    date: 'March 27, 2026',
    readTime: '10 min read',
    tags: ['GDPR', 'Healthcare', 'Health Data'],
  },
  {
    slug: 'gdpr-international-data-transfers',
    title: 'GDPR International Data Transfers: SCCs, Adequacy, and What\'s Changed',
    excerpt: 'Sending EU data to the US or other countries requires legal safeguards. Here\'s the current state of SCCs, the EU-US Data Privacy Framework, and what your business must do.',
    date: 'March 27, 2026',
    readTime: '10 min read',
    tags: ['GDPR', 'Data Transfers', 'SCCs'],
  },
  {
    slug: 'gdpr-mobile-apps',
    title: 'GDPR for Mobile Apps: What App Developers Must Do Before Launch',
    excerpt: 'Mobile apps collect device IDs, location, and behavioral data. Here\'s what GDPR requires before you ship — from consent flows to App Store privacy labels.',
    date: 'March 27, 2026',
    readTime: '10 min read',
    tags: ['GDPR', 'Mobile', 'App Development'],
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

      {/* Email capture */}
      <div className="mt-16">
        <BlogEmailCapture />
      </div>

      {/* CTA */}
      <div className="mt-8 rounded-2xl bg-navy-950 px-8 py-10 text-center dark:bg-navy-900">
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
