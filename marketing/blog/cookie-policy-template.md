# Cookie Policy Template: What to Include (And What Most Get Wrong)

The cookie policy template you copied from a Google search probably lists cookies you don't use — and misses half the cookies you do. That's not a minor inconvenience. Under GDPR, a cookie policy that doesn't reflect your actual site is a compliance liability, not a compliance solution.

This guide covers exactly what a proper cookie policy must contain, how it differs from a privacy policy, what GDPR and CCPA require, and why policies generated from real site scans are legally far more defensible than any generic template.

---

## Cookie Policy vs. Privacy Policy: What's the Difference?

Many website owners treat these two documents as interchangeable. They're not.

A **privacy policy** covers your entire data handling operation — what personal data you collect, why you collect it, how long you keep it, who you share it with, and what rights users have. It's a broad document covering forms, emails, accounts, purchases, and more.

A **cookie policy** is narrower and more technical. It focuses specifically on cookies and similar tracking technologies — what they are, which ones you use, what each one does, and how users can control or opt out.

**Do you need both?** Probably yes. GDPR requires transparency about all data processing (hence the privacy policy) and explicit disclosure about cookies (hence the cookie policy). Some businesses combine them into a single document with a dedicated cookie section — that's generally acceptable, as long as the cookie information is clear and specific.

A cookie policy template should stand on its own or integrate cleanly with your privacy policy. The key requirement under both GDPR and CCPA is specificity: generic statements don't satisfy regulators.

---

## What GDPR Requires in a Cookie Policy

Under GDPR, the requirement isn't just to have a cookie policy — it's to have an accurate, specific, and accessible one.

Article 13 and Article 14 of GDPR require that users receive specific information about data processing at the time of collection. For cookies, this means:

- **What cookies are set** — not generic categories, but the actual cookies
- **Who sets them** — first-party (your site) or third-party (Google, Meta, etc.)
- **What they do** — the specific purpose, not just "analytics"
- **How long they last** — session or persistent, and exact duration
- **The legal basis** — consent for non-essential cookies, legitimate interest (rarely applicable) for others
- **How users can withdraw consent** — and that withdrawing is as easy as giving it

The EU's ePrivacy Directive (which sits alongside GDPR) adds: **non-essential cookies require prior, informed, and freely given consent**. This means the cookie policy needs to be accessible before consent is given — not buried in a footer link that nobody reads.

Supervisory authorities across Europe have made it clear that **pre-ticked boxes, consent by scrolling, and vague "we use cookies to improve your experience" statements don't comply**. The cookie policy must give users enough information to make a meaningful choice.

---

## What CCPA Requires (California)

CCPA (California Consumer Privacy Act) takes a different approach. Rather than requiring consent before setting cookies, CCPA focuses on:

- **The right to know** what categories of personal information are collected, including data collected via cookies
- **The right to opt out** of the sale or sharing of personal information — if cookies enable data sharing with ad networks, you need a "Do Not Sell or Share My Personal Information" link
- **The right to delete** personal information collected via cookies and other means

For most small business websites, the key CCPA implication is: if you run advertising cookies that share behavioral data with third parties (like Meta Pixel or Google Ads), you may be "selling" personal information under CCPA's broad definition. You need to disclose this and provide an opt-out mechanism.

Your cookie policy template should include a CCPA-specific section if you have California users — which, if your site is publicly accessible, you almost certainly do.

---

## The 5 Sections Every Cookie Policy Needs

No matter which cookie policy template you start from, it must include these five sections to be compliant.

### 1. What Cookies Are

A brief, plain-language explanation of what cookies are and how they work. Don't assume your visitors know. This section also typically covers related technologies — web beacons, pixels, local storage — that function similarly to cookies.

### 2. Cookie Categories

Organize your cookies into categories so users understand what they're consenting to. The standard categories are:

- **Strictly necessary** — cookies required for the site to function (login sessions, shopping cart, security). These don't require consent under GDPR, though they still need to be disclosed.
- **Analytics/performance** — cookies that measure how users interact with your site (Google Analytics, Hotjar). These require consent.
- **Marketing/advertising** — cookies used to track users across sites and show targeted ads (Meta Pixel, Google Ads). These require consent and may trigger CCPA disclosure obligations.
- **Preference/functional** — cookies that remember user settings (language, theme, cookie preferences themselves). Typically require consent unless they're genuinely essential to a requested service.

### 3. Specific Cookies You Use

This is where most cookie policy templates fail entirely.

A compliant cookie policy doesn't say "we use analytics cookies." It lists the actual cookies:

| Cookie Name | Provider | Purpose | Duration |
|-------------|----------|---------|----------|
| _ga | Google Analytics | Distinguishes unique users | 2 years |
| _gid | Google Analytics | Distinguishes users (session) | 24 hours |
| _fbp | Meta | Identifies browsers for ad delivery | 3 months |
| cookieconsent_status | Custodia | Stores consent preferences | 1 year |

A generic cookie policy template can't give you this table — because it doesn't know which cookies your site actually sets. This is the core problem with template-based approaches.

### 4. How Users Can Manage Cookies

This section must explain:

- How to change preferences in your consent banner
- How to delete cookies in major browsers (Chrome, Firefox, Safari, Edge)
- Opt-out links for specific third-party providers (Google Analytics opt-out, Meta ad preferences, etc.)
- What happens if they decline non-essential cookies (be honest — some features may not work)

Don't just say "you can manage cookies in your browser settings" and leave it at that. Regulators expect a meaningful description of how your specific consent management works.

### 5. How You Update the Policy

Your cookie policy must include a last-updated date and explain how you'll notify users of changes. Best practice is to require renewed consent if you add new cookie categories or materially change how existing cookies are used.

---

## The Problem with Generic Cookie Policy Templates

Here's the core issue with copy-paste cookie policy templates: they're written for a hypothetical website, not yours.

A generic cookie policy template might list:
- Google Analytics (_ga, _gid) — but you might use Plausible or Fathom
- Facebook Pixel (_fbp) — but you might not run Facebook ads at all
- Intercom chat cookies — but you use Crisp or no chat tool
- Stripe payment cookies — but you use a different payment processor

Meanwhile, your site might set cookies from Hotjar, Segment, Cloudflare, your CMS, or a dozen other tools that the template never mentions.

The result: your cookie policy describes a website that isn't yours. Users reading it can't make informed decisions about what they're consenting to. And if a regulator reviews your site, the mismatch between your stated cookies and your actual cookies is a red flag.

**This isn't hypothetical.** The French data protection authority (CNIL) has specifically called out inaccurate cookie policies as compliance failures. German DPAs have fined companies for cookie banners that didn't match actual cookie behavior.

---

## How to Find What Cookies Your Site Actually Sets

Before you write or update a cookie policy template, you need to know what's actually running on your site.

### Option 1: Browser DevTools

In Chrome or Firefox:
1. Open DevTools (F12)
2. Go to the Application tab (Chrome) or Storage tab (Firefox)
3. Click on Cookies in the left panel
4. Select your domain

This shows you the cookies currently set. Browse through several pages, log in if relevant, and interact with your site normally to trigger all cookie-setting behavior. Check the Network tab for third-party requests.

Limitation: this catches the cookies set during your browsing session, but you need to know what's set across all user journeys — including after consent is given for tracking.

### Option 2: Automated Scanner

A cookie scanner crawls your site, triggers various user flows, and reports all cookies detected — with names, providers, purposes, and durations identified automatically.

[Custodia's free cookie scanner](https://app.custodia-privacy.com/scan) does this automatically. Scan your site, get a complete list of cookies detected, and use that data as the foundation for your cookie policy. The result is a cookie policy generated from your actual site data — not a template guessing what you might use.

This is the difference between a cookie policy template and a compliant cookie policy.

---

## Cookie Categories Explained: Session vs. Persistent, First-Party vs. Third-Party

Understanding cookie types helps you categorize them correctly in your policy.

### Session vs. Persistent

**Session cookies** are deleted when the user closes their browser. They're typically used for essential functionality — keeping you logged in during a session, maintaining a shopping cart, preventing cross-site request forgery.

**Persistent cookies** remain on the user's device until they expire or are deleted. Analytics and advertising cookies are almost always persistent — that's how they track users across visits. Duration ranges from days (some A/B testing tools) to years (Google Analytics: 2 years by default).

Your cookie policy must state the duration for each persistent cookie.

### First-Party vs. Third-Party

**First-party cookies** are set by your domain. They're usually essential or functional.

**Third-party cookies** are set by external domains — Google, Meta, Hotjar, Intercom, Stripe, etc. These are typically analytics, advertising, or support tools. Third-party cookies used for advertising are the most scrutinized under both GDPR and CCPA.

Note: with Chrome's ongoing deprecation of third-party cookies, many ad platforms have shifted to server-side tracking and first-party cookie equivalents. If you use Google Ads, Meta, or similar tools, check whether their implementation has changed since you last updated your cookie policy.

---

## How Often to Update Your Cookie Policy

Your cookie policy is not a one-and-done document. Update it whenever:

- **You add a new tool** that sets cookies (new analytics platform, chat widget, advertising pixel, etc.)
- **You remove a tool** that previously set cookies
- **A third-party provider changes** how their cookies work (duration, purpose, cross-site sharing)
- **You change your consent mechanism** (new cookie banner, new CMP platform)
- **Regulations change** (new state laws, updated guidance from supervisory authorities)
- **You launch in a new market** with different requirements

A practical minimum: audit your actual cookies against your stated policy at least every 6 months. Tools and integrations change. A SaaS app you use may have quietly added new tracking. Your cookie policy needs to keep up.

Set a calendar reminder. Treat it like a renewal, not a one-time task.

---

## Why Auto-Generated Cookie Policies Are More Defensible

When a regulator reviews your cookie policy — whether following a complaint or as part of a sweep — they're going to look at whether your stated cookies match your actual cookies.

A policy generated from a real site scan is more defensible because:

1. **It's accurate at the time of generation** — the cookies listed are the cookies your site actually sets
2. **It demonstrates due diligence** — you ran a scan, you identified what's running, you documented it
3. **It's specific** — real cookie names, real providers, real durations (not generic placeholders)
4. **It's dated** — you can show when the policy was generated relative to when the scan was run

Compare this to a generic cookie policy template: you copy it, change the company name, and publish it. You have no evidence that you ever checked what cookies your site actually sets. The policy is vague. The cookies listed may not match what's on your site.

If you're ever asked to demonstrate compliance, "we used a scanner and generated our policy from the results" is a far stronger position than "we used a template we found online."

---

## Build Your Cookie Policy from Your Actual Cookies

The right approach to a cookie policy isn't to find a better template — it's to stop using templates altogether.

**Here's the process:**

1. **Scan your site** to discover every cookie being set — names, providers, purposes, durations
2. **Categorize them** into necessary, analytics, marketing, and preference buckets
3. **Generate your policy** from the actual data, with specific entries for each cookie
4. **Connect it to your consent banner** so users can manage their preferences with real effect
5. **Set a reminder** to re-scan and update every 6 months, or whenever you add new tools

[Custodia](https://app.custodia-privacy.com) automates steps 1 through 4. Scan your site for free — no signup required, results in 60 seconds. You'll see every cookie your site sets, automatically categorized, with a compliant cookie policy generated from real data.

That's the difference between a cookie policy template and actual compliance.

[Scan your site free →](https://app.custodia-privacy.com/scan)

---

*Last updated: March 2026*
