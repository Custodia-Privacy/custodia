# GDPR for Startups: A Founder's Compliance Roadmap (Without a Legal Team)

*Most startup founders know they need GDPR compliance but have no idea where to start. This is the guide for founders who don't have a legal team — practical steps you can actually take in order.*

---

## Does GDPR Apply to Your Startup?

Yes — if you have any EU users, it applies to you.

That includes free users. Beta testers. People who signed up and never came back. Visitors who hit your marketing site from Berlin and bounced in 10 seconds. If you collect or process personal data about EU residents — names, email addresses, IP addresses, behavioral analytics, anything — you're in scope.

This is the part most US-based founders get wrong. GDPR's jurisdiction isn't defined by where your company is incorporated or where your servers are. It's defined by where your users are. If you have EU data subjects, GDPR applies. Full stop.

The threshold isn't company size. There's no "under 10 employees" exemption. There's no "we're a startup so regulators won't care" carve-out. The regulation applies from user one.

---

## The GDPR Startup Risk Reality Check

Let's be direct here: regulators don't typically send enforcement letters to 8-person startups with 200 users. That's not where GDPR enforcement energy goes.

But here's what actually happens to startups that ignore it:

**Unhappy users file complaints.** An EU user who feels their data was mishandled can file a complaint directly with their national data protection authority. That complaint triggers an investigation. The DPA contacts you. Now you're managing a regulatory response with no documentation, no process, and no privacy policy that describes what you actually do. That's a bad position to be in.

**Enterprise customers ask for proof.** The first time a company with a legal team evaluates your SaaS, they'll send you a vendor questionnaire. Somewhere on page two: "Are you GDPR compliant? Can you sign a Data Processing Agreement?" If the answer is no, the deal stalls or dies. Getting compliant before the deal closes is the only move that doesn't cost you revenue.

**Early setup is cheap. Retroactive fixes are not.** Running a data inventory and writing a real privacy policy takes a few hours now. Doing it after you've scaled — with three years of user data across eight systems — takes weeks and often requires outside legal help.

**A breach without a compliance program is a worse situation.** If you have a data breach and no documentation of your data practices, no consent records, no DPAs with vendors — you're exposed. A breach inside a functioning compliance program is manageable. A breach that reveals you've never thought about this is much harder to contain.

---

## Phase 1 — Know What You Collect (Week 1)

You can't comply with data minimization, consent requirements, or user rights if you don't know what personal data your systems are touching. Start here.

**Run a scan on your marketing site.** Your site is likely firing trackers, analytics, and third-party scripts you didn't explicitly choose. A plugin someone installed two years ago. GA4 configured without consent gating. A chat widget that loads before any consent is given. [app.custodia-privacy.com/scan](https://app.custodia-privacy.com/scan) gives you the full picture in 60 seconds.

**Map your data flows inside the product.** What personal data comes in when a user signs up? Where does it go — your database, your email platform, your analytics tool, your support tool? Who are the third parties that touch it?

**Build a data inventory spreadsheet.** It doesn't need to be elaborate. Four columns gets you started: data type (email, name, IP, usage events), purpose (account creation, analytics, support), lawful basis (contract, consent, legitimate interest), and retention period (how long you keep it). Add a fifth column for third-party processors.

This document is your foundation. Everything else in GDPR compliance — your privacy policy, your consent flows, your DPA negotiations — references it. Do this first.

---

## Phase 2 — Get the Legal Basis Right (Week 1–2)

GDPR requires a lawful basis for every processing activity. You need to identify the right one — not just pick the easiest.

**Contract** is appropriate when processing is necessary to deliver a service the user has signed up for. Sign-up data, account information, billing details — these are typically processed on the basis of contract. Clear and defensible.

**Legitimate interest** is a flexible basis, but it requires a three-part test: you have a legitimate interest, processing is necessary to achieve it, and it doesn't override the individual's rights. Product analytics (aggregate, behavioral) and fraud prevention often qualify. Document your reasoning.

**Consent** is the most misunderstood basis. It requires: freely given (not bundled with sign-up), specific (separately obtained for each purpose), informed (users know what they're agreeing to), and unambiguous (active opt-in, not pre-checked boxes). Marketing emails sent to people who signed up for your product need consent unless you're relying on the soft opt-in exemption (existing customer relationship, similar products, easy opt-out). For third-party advertising and tracking — consent is almost always required.

**The common mistake:** defaulting to consent for everything because it feels "safest." It isn't. Consent has the strictest requirements and can be withdrawn at any time. Use the right basis for each activity and document it in your data inventory.

---

## Phase 3 — Fix the User-Facing Stuff (Week 2–3)

This is the visible layer of compliance — what users actually see. It matters both legally and commercially.

**Privacy policy.** Write one that names your actual stack. Not a template. A policy that says "we may share data with third-party service providers" tells users nothing. Your policy should name Stripe, AWS, your email platform, your analytics tool, your support system. It should describe what data you collect, why, how long you keep it, who gets it, and what rights users have. Generate it from your data inventory.

**Cookie consent.** Implement a banner that blocks non-essential trackers before consent is given. Analytics, advertising pixels, session recording — none of these can fire before a user actively consents. "By continuing to use this site, you agree" is not valid consent. You need a banner with Accept/Decline that gates the scripts.

**Account deletion.** When a user asks to delete their account, it needs to actually delete their data — not just deactivate the account. Test this. Trace where a user's data lives (your database, Stripe, Intercom, Mailchimp, Sentry) and make sure deletion flows through all of it, or that you have a documented process for purging it manually.

**Unsubscribe.** Marketing emails need a one-click unsubscribe that actually works. Not "email us to unsubscribe." A link in the footer that removes them from the list.

---

## Phase 4 — Handle DSARs (Week 3–4)

A Data Subject Access Request (DSAR) is when an EU user asks to see, correct, or delete all the data you hold about them. GDPR gives you 30 days to respond.

Set up **privacy@yourdomain.com** as your DSAR intake email. Put it in your privacy policy. Make it easy to find.

Then document your process: who receives the request, how you verify the identity of the requester (you need to confirm they are who they say they are), how you pull data from each system, and what you send back or delete.

Here's where startups consistently underestimate the work: your user's data is probably spread across six systems. Your main database has their account and usage data. Stripe has payment history and card details. Intercom or your support tool has every conversation. Mailchimp or your email platform has their contact record and email history. Sentry has stack traces that may include their user ID. Possibly a CRM. Possibly a data warehouse.

A data access request means pulling all of it. A deletion request means purging all of it (within the limits of your legal obligations — financial records have retention requirements).

Walk through this manually once before you have to do it under pressure. You will find gaps.

---

## Phase 5 — Get DPAs from Your Vendors (Ongoing)

Every vendor that handles personal data on your behalf is a sub-processor under GDPR Article 28. You need a Data Processing Agreement in place with each of them.

The good news: every major vendor has one. This is mostly an administrative task, not a negotiation.

Go through your tech stack systematically:

- **Cloud infrastructure** (AWS, GCP, Azure) — DPA is available in your account console, usually as a click-through
- **Stripe** — DPA available in their legal documentation, or request via their support process
- **Email platforms** (Mailchimp, Postmark, SendGrid, Resend) — DPA in their terms or downloadable
- **Analytics** (Mixpanel, Amplitude, PostHog) — DPA available in their settings or on request
- **Support tools** (Intercom, Zendesk, Help Scout) — DPA downloadable from their privacy pages
- **Error monitoring** (Sentry, Datadog) — DPA on request or in their terms

Create a sub-processor list in your data inventory. This doubles as documentation you can share with enterprise customers who ask.

---

## The Enterprise Customer GDPR Question

At some point, a customer with a procurement process will ask you: "Are you GDPR compliant?"

The answer needs to be yes — and you need to be able to back it up.

What enterprise customers actually want to see: a privacy policy that reflects real data practices, a DPA template you can sign with them (covering Article 28 requirements), evidence of consent management (your cookie banner, consent records), and a documented DSAR process.

This isn't a trick question or a box-checking exercise. Their legal team has liability if they use a vendor that isn't compliant. They're doing due diligence.

The time to build this is before the deal closes. If you're scrambling to write a DPA while a procurement team is waiting, you're in a weak position. If you send over a DPA template on day one of the conversation, you look like a company that has its act together.

---

## The Fastest Way to Get There

The five phases above take 3–4 weeks if you work through them in order. The bottleneck is usually the data inventory (Phase 1) — everything else follows from it.

Custodia was built for exactly this situation: startups and small businesses that need real compliance without a legal team or an enterprise budget.

Scan your site to see what's actually running. Get your consent banner and privacy policy generated from real data — not a template. Build out your DSAR process. Get your sub-processor documentation in order.

$29/month. Start with the scan: [app.custodia-privacy.com/scan](https://app.custodia-privacy.com/scan)

*Last updated: March 2026*
