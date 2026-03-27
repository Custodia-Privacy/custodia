# Custodia — Outreach Templates

---

## Reddit Posts

### r/smallbusiness

**Title:** Free tool to check if your website is GDPR/CCPA compliant

I've been working on a privacy compliance tool for small businesses and wanted to share the free scanner with this community.

You paste in your website URL, and it crawls your site like a real visitor — detecting every cookie, tracking pixel, and third-party script. Then it shows you:

- How many trackers are on your site (and which ones)
- Where your visitors' data is being sent
- Which privacy regulations apply to you
- Specific gaps in your compliance

No signup needed, takes about 60 seconds: https://app.custodia-privacy.com/scan

The reason I built this: I kept meeting small business owners who'd been quoted $5K-$15K by privacy consultants just to figure out where they stood. That felt wrong. The scan should be free.

If you want to go further (consent banner, privacy policy, ongoing monitoring), paid plans start at $29/mo — but the scan is genuinely free with no strings attached.

Happy to answer any GDPR/CCPA questions in the comments.

---

### r/GDPR

**Title:** We built a free GDPR compliance scanner — would appreciate feedback from this community

Hi r/GDPR — long-time lurker, first-time poster with something I hope is useful.

We built Custodia, an AI-powered privacy compliance platform focused on small businesses. The core insight: most SMBs don't know what data their website actually collects, so they can't comply properly.

Our scanner crawls your website in a headless browser and detects:
- All first-party and third-party cookies
- Tracking pixels (Meta, Google, LinkedIn, etc.)
- Third-party scripts and data transfers
- Local/session storage usage

It then classifies each finding by purpose, maps the data flows, and shows you where you stand against GDPR requirements.

The scan is free, no signup: https://app.custodia-privacy.com/scan

For the privacy professionals here: I'd love your feedback on accuracy and what we might be missing. We're continuously improving the classification engine and want to make sure it meets the standards this community expects.

---

### r/startups

**Title:** Launched today: AI-powered privacy compliance for startups ($29/mo vs $10K+ enterprise tools)

Hey r/startups — launching Custodia today and wanted to share here because this community was a big part of why we built it.

**The problem:** Privacy compliance is a real requirement (GDPR, CCPA, state laws) but the tools are either:
- Too thin: Cookie banner plugins that give you a popup but not real compliance
- Too expensive: Enterprise platforms at $5K-50K/year designed for Fortune 500

**What we built:** Custodia scans your website, finds every tracker, and builds your full compliance stack:
- Consent banner generated from real scan data
- Privacy policy written from your actual data practices
- Compliance dashboard across all applicable regulations
- DSAR management with AI-drafted responses
- Weekly re-scans to catch drift

**Pricing:** Free scan → $29/mo Starter → $79/mo Growth → $149/mo Business

Try the free scan (no signup): https://app.custodia-privacy.com/scan

Happy to answer questions about the technical approach, pricing decisions, or how we validated the market.

---

## Hacker News

### Show HN Post

**Title:** Show HN: Custodia – AI-powered privacy compliance for small businesses

Custodia scans your website to detect every cookie, tracker, and third-party script, then builds your compliance stack: consent banner, privacy policy, compliance dashboard, DSAR management.

The approach: instead of starting from templates, we start from a real scan. A headless browser crawls your site, and AI classifies every finding by purpose, vendor, and applicable legal framework. Your consent banner and privacy policy are generated from that data and update automatically when your site changes.

Technical details:
- Headless Chromium scanner with custom instrumentation for cookie/tracker detection
- AI classification engine trained on 10K+ tracking technologies
- Jurisdiction-aware consent logic (GDPR opt-in, CCPA opt-out)
- Google Consent Mode v2 integration
- tRPC API with MCP server for AI agent integration

Free scan (no signup): https://app.custodia-privacy.com/scan

Pricing: $29/mo for 1 site, $79/mo for 3, $149/mo for 10.

We're particularly interested in feedback on the scanner accuracy and the MCP server approach — we designed Custodia to be agent-first, where AI agents can manage compliance programmatically via the MCP protocol.

---

## IndieHackers Post

**Title:** Launching Custodia: AI privacy compliance for small businesses

**What is it?**
Custodia is an AI-powered privacy compliance platform. It scans your website, finds every tracker, and builds your consent banner, privacy policy, and compliance dashboard from real data.

**Why I built it:**
I kept running into the same problem: small businesses that needed GDPR/CCPA compliance but had terrible options. Cookie banner tools are just a popup. Enterprise platforms cost $10K+/year. Nobody was building for the 5-50 person company.

**How it works:**
1. AI scans your website (headless browser, real visitor simulation)
2. Detects and classifies every cookie, tracker, and third-party script
3. Generates a jurisdiction-aware consent banner
4. Writes a privacy policy from your actual data practices
5. Monitors weekly and alerts you to changes

**Business model:**
- Free: website scan (lead gen)
- $29/mo: 1 site, full compliance stack
- $79/mo: 3 sites + DSARs + PIAs
- $149/mo: 10 sites + data governance + API

**Current status:**
Launched today. Product is live. Looking for early users and feedback.

Try it: https://app.custodia-privacy.com/scan

---

## Newsletter Pitch Emails

### Variant A: Tech/SaaS Newsletter

**Subject:** New launch: AI privacy compliance for small businesses (free scan)

Hi {editor_name},

I'm reaching out because I think Custodia might be a good fit for {newsletter_name}'s audience.

We just launched an AI-powered privacy compliance platform built for small businesses. The core idea: most SMBs know they need GDPR/CCPA compliance but the tools available are either too thin (cookie banners) or too expensive (OneTrust at $10K+/year).

Custodia fills the gap — AI scans your website, finds every tracker, and builds your full compliance stack (consent banner, privacy policy, dashboard, DSAR management) for $29/month.

The free scan takes 60 seconds with no signup: https://app.custodia-privacy.com/scan

Happy to provide a demo, share our approach, or write a guest piece on privacy compliance for your audience.

Best,
{name}

### Variant B: Business/SMB Newsletter

**Subject:** Privacy compliance doesn't have to cost $10,000

Hi {editor_name},

I wanted to share something I think your small business audience will find useful.

We just launched a free website privacy scanner — paste your URL and in 60 seconds you'll see every cookie, tracker, and third-party script collecting data from your visitors.

The surprising finding from our beta: the average small business website has 17 trackers, many of which the owner doesn't know about. Under GDPR and CCPA, that's a compliance gap.

Custodia (https://app.custodia-privacy.com/scan) is the full solution — AI-powered compliance that's actually affordable ($29/mo vs $10K+/year for enterprise tools).

Would this be relevant for a feature in {newsletter_name}? Happy to share more details or a custom demo.

Best,
{name}

### Variant C: AI/Tech Newsletter

**Subject:** AI-native compliance: how we're using Claude to automate GDPR

Hi {editor_name},

We just launched Custodia, an AI-native privacy compliance platform with an interesting architectural twist — it's agent-first.

The platform exposes 40+ tools via the MCP protocol, so AI agents (Claude, GPT, custom agents) can manage privacy compliance programmatically: run scans, generate policies, handle DSARs, monitor compliance.

The human dashboard exists for monitoring and configuration, but the primary "users" are AI agents.

We think this is where compliance is heading — autonomous agents handling the tedious, detail-oriented work that humans aren't great at (like tracking which of your 23 third-party scripts are mentioned in your privacy policy).

Free scan: https://app.custodia-privacy.com/scan

Would this be a fit for {newsletter_name}? Happy to go deeper on the agent-first architecture or the technical approach.

Best,
{name}

---

## Partnership Outreach: Web Agencies

**Subject:** Privacy compliance offering for your clients?

Hi {name},

I'm reaching out because I think there's a natural partnership opportunity between {agency_name} and Custodia.

When you build websites for clients, privacy compliance often comes up — but it's not your core business. Cookie banners, privacy policies, GDPR, CCPA... it's a lot of complexity that clients need but agencies shouldn't have to become experts in.

Custodia handles it: we scan the website, generate the consent banner and privacy policy from real data, and monitor ongoing compliance. Your clients get compliant, you don't have to become privacy lawyers.

We're setting up a partner program for agencies:
- Reseller margin on client accounts
- Co-branded compliance reports for client pitches
- White-label option on Business plans
- Priority support for partner accounts

Would this be useful for your clients? Happy to do a quick demo and discuss what a partnership might look like.

Best,
{name}

---

### r/webdev

**Title:** Built a free tool that scans any website for privacy compliance issues in 60 seconds

Hey r/webdev — built something I think is useful for anyone doing client work.

It's a free website privacy scanner: you paste a URL and it runs a headless browser scan to find every cookie, tracker, pixel, and third-party script on the site — then flags the GDPR/CCPA compliance issues.

**Why this matters for web developers:**

If you build websites for clients, you're often responsible for whatever's running on those pages. A client installs a plugin, you add an analytics snippet, someone enables a chat widget — suddenly there are 12 third-party scripts firing on every page load, and neither you nor the client know what they're doing.

Under GDPR, the site owner is the data controller. But practically speaking, the developer who set it up often gets the call when something's wrong.

The scanner: https://app.custodia-privacy.com/scan (no signup, ~60 seconds)

It shows you exactly what's running, what data it's collecting, and what the compliance gaps are. Useful for your own projects or as a pre-launch audit for clients.

The full product (consent banner, privacy policy, DSAR handling, monitoring) is paid starting at $29/mo, but the scan is completely free.

---

### r/digital_marketing

**Title:** Google Consent Mode v2 became mandatory in March 2024 — is your setup actually compliant?

Cross-posting this here because I've been surprised how many marketers think they've implemented Consent Mode v2 when they actually haven't.

**Common mistakes I see:**

1. **Wrong load order** — The `gtag('consent', 'default', {...})` call fires AFTER Google Analytics initializes. Looks fine in GTM, but the signals aren't actually controlling GA before it starts collecting.

2. **Missing v2 parameters** — Consent Mode v1 had two parameters (`ad_storage`, `analytics_storage`). v2 added two more (`ad_user_data`, `ad_personalization`). If your consent initialization tag was set up before early 2024, it probably only passes the v1 parameters.

3. **Blended signals** — If your banner lets users accept analytics but decline marketing, your Consent Mode update should reflect that split individually, not collapse everything into a single grant/deny.

**Why it matters:** Without correct v2 signals, Google can't apply behavioral modeling to fill gaps from non-consenting users. In markets like Germany and France where 40-60% of users decline cookies, you're flying blind on nearly half your audience.

Free tool to check what's running on your site: https://app.custodia-privacy.com/scan

If you want to discuss the technical implementation or share what consent setup is working for you, happy to get into it in the comments.

---

### r/ecommerce

**Title:** GDPR/CCPA compliance for e-commerce: what actually matters (and what's just theater)

Running an e-commerce site means you're collecting more personal data than almost any other type of business — payment info, purchase history, browsing behavior, email addresses, shipping addresses. That's a lot of exposure.

**What actually matters for e-commerce compliance:**

**1. Know what's on your site.** Most store owners don't. Between the platform (Shopify/WooCommerce), apps/plugins, and the marketing tools they've installed, the average e-commerce site has 15-25 third-party scripts collecting data. Run a scan and find out: https://app.custodia-privacy.com/scan

**2. Your consent banner needs to actually block things.** Not just display. If Meta Pixel fires before a user clicks Accept, you have a consent gap — regardless of what your banner says.

**3. Your privacy policy must name your actual processors.** If you use Klaviyo for email, Stripe for payments, Hotjar for session recording, and Google Analytics for traffic — all four need to be named in your policy with their purpose and data handling. Generic templates don't do this.

**4. Set up a DSAR process.** Under GDPR, any EU customer can ask for all the data you hold on them. Under CCPA, California customers have 45 days. You need an intake form and a documented process.

The free scan I linked above shows you #1 immediately. The full platform handles #2-4 from $29/mo.

Happy to answer questions about e-commerce compliance specifically — it's a topic with a lot of nuance around payment processors, email platforms, and third-party apps.
