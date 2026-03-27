# GDPR for SaaS Companies: The Founder's Compliance Guide (2026)

*GDPR hits SaaS companies differently. You're a data processor for your customers and a data controller for yourself simultaneously. Here's what that means and what to do about it.*

---

## Why GDPR Is More Complex for SaaS Than for a Content Site

If you run a blog or marketing website, GDPR is about one thing: what you collect from your own visitors. Cookie banners, privacy policies, analytics consent. Real work, but contained.

If you run a SaaS company, you have all of that — plus an entirely different layer on top of it.

When your customers use your product, they upload data, create records, and process personal information about their own users. That data runs through your infrastructure. You're not just responsible for your own data collection — you're responsible for your customers' data on their behalf.

This creates two distinct compliance obligations most SaaS founders conflate or ignore:

**You are a data controller** for data you collect directly — marketing site visitors, trial signups, account holders.

**You are a data processor** for data your customers bring into your product — end-user records, contact lists, whatever flows through your platform.

Both roles carry GDPR obligations. Both carry liability. Most SaaS founders have done some work on the controller side (a privacy policy, maybe a cookie banner) and almost nothing on the processor side. That's the gap this guide closes.

---

## The Controller vs. Processor Distinction — What It Means in Practice

**The controller** decides why personal data is collected and how it's used. GDPR's user rights obligations — access requests, deletion, corrections — run to the controller.

**The processor** handles personal data on behalf of a controller, following their instructions. When your customer uploads their user base into your product, you're the processor. They decide what happens to the data. You execute it.

**In practice:** Your B2B customers are the data controllers for personal data they store in your product. They have compliance obligations to their own users. When they sign up for your SaaS, they're asking you to process that data on their behalf. Under GDPR Article 28, they are required to have a written agreement with you governing that processing — a Data Processing Agreement. If you don't have one ready, you're stalling enterprise deals before they start.

---

## Data Processing Agreements (DPAs) — What They Are and Why You Need One

A Data Processing Agreement is a legally binding contract between a data controller (your customer) and a data processor (you) that specifies how personal data will be handled. GDPR Article 28 makes them mandatory. Without a DPA in place, your customer is technically out of compliance for using your product.

**What a DPA must contain:** Subject matter, duration, purpose, and nature of the processing; data types and categories of data subjects; a requirement to process only on documented instructions; confidentiality obligations; security measures (Article 32); sub-processor obligations; assistance with data subject rights; data deletion or return on contract end; and audit rights for the controller.

**The enterprise sales reality:** Any customer with a legal team will send you a DPA before signing. If you don't have your own template, you'll sign theirs — on their terms. Experienced founders publish their DPA and make it the starting point. Get a privacy lawyer to draft it. It pays for itself the first time an enterprise deal turns on it.

---

## Sub-Processors — Every Tool You Use Is On the Hook

When you process customer data, you use third-party services to do it. Your hosting provider stores data. Your monitoring service sees stack traces. Your support tool logs conversations. Every one of these is a **sub-processor** under GDPR Article 28.

**In practice:**

- Maintain a published sub-processor list — every third party that may touch customer personal data, with their location and the data they receive
- When you add a new sub-processor, notify customers 30 days in advance and give them the right to object
- Your DPA must flow obligations down to sub-processors — meaning you need DPAs with AWS, Stripe, Intercom, Sentry, and any service that processes customer data

Not having a sub-processor list is one of the fastest ways to lose an enterprise deal. Publish it at `/legal/sub-processors` and link to it from your DPA.

---

## Your Own Website Compliance — This Part Is Non-Negotiable Too

Your marketing site — where you run your blog, capture trial signups, and run ads — is where you're a data controller. The rules here are the same as for any website under GDPR.

**Cookie consent:** Non-essential cookies (analytics, ad pixels, retargeting) cannot fire until the visitor actively consents. Not a banner that loads cookies and says "by continuing, you agree." An actual opt-in that blocks scripts before consent is given.

**Privacy policy:** Must describe what data you collect, why, the legal basis, who you share it with (specific third parties, not just "partners"), how long you keep it, and how EU visitors can exercise their rights. A generic template that doesn't mention your actual tools is not compliant.

This is the stuff that's easy to deprioritize while you're focused on product. Don't. Your marketing site is the front door. If a privacy-conscious prospect scans it and finds trackers firing without consent, that's a credibility problem before the conversation even starts.

---

## User Data Within Your SaaS Product

Beyond the controller/processor dynamic with your customers, you also manage data about your own end-users — people who create accounts, log in, and use the product. For them, you're the controller. That comes with obligations.

**Data minimization:** Only collect what you need. If you're asking for a phone number at signup but never call anyone, remove the field. Audit your onboarding flow and integrations with fresh eyes.

**Retention policies:** Set them and enforce them. How long do you keep logs? What happens to data when a user cancels? When does a trial account get purged? Write the policies, build the deletion jobs, document them in your privacy policy.

**DSAR handling:** Any EU user can request a copy of all personal data you hold, request deletion, or ask you to stop processing. You have 30 days to respond. Know where user data lives — across which databases, third-party tools, backup systems — before the first request lands.

---

## International Data Transfers — If You're US-Based, Read This

If your infrastructure is in the US and you process EU residents' personal data, you need a legal mechanism to do it. The EU considers the US a third country without adequate data protection.

The standard mechanism is **Standard Contractual Clauses (SCCs)** — EC-approved contractual terms incorporated into your agreements. Your customer DPAs should include SCCs for the applicable scenario (controller-to-processor is Module 2). Your sub-processor agreements need them too.

The EU-US Data Privacy Framework (DPF) is an alternative for US companies willing to certify — it functions as an adequacy mechanism but requires annual renewal.

Storing EU data in EU-region infrastructure reduces exposure but doesn't eliminate it. Your team's access patterns and sub-processor locations still matter. Review your transfer setup with a privacy lawyer before signing enterprise DPAs.

---

## Common SaaS GDPR Mistakes

### 1. No DPA Template Ready When an Enterprise Customer Asks

The most common deal-killer. A prospect's legal team requests a DPA as part of procurement. You don't have one. You scramble for a lawyer. The deal stalls. Have your DPA template ready before you need it — not as a blocker but as a proof point that you're a serious vendor.

### 2. Not Maintaining a Sub-Processor List

Without a published list, you can't give the required notice when you add new tools. You're also out of compliance with every DPA you've signed. Create it, publish it, and maintain a process for updating it when you adopt new tools.

### 3. Marketing Site Out of Compliance While the Product Gets All the Attention

Engineering time goes into the product. The marketing site's cookie banner from two years ago quietly loads trackers without consent. Regulators don't distinguish between your product and your marketing site.

### 4. Ignoring DSAR Requests from End-Users

A request lands in your support inbox. It gets triaged as a "weird legal email" and sits. Thirty days pass. You're non-compliant. Build a simple intake process before the first request comes in, not after.

### 5. Assuming SCCs Are Someone Else's Problem

If you're US-based, international data transfers are your problem — not just your customers'. If your DPA doesn't address SCCs and you process EU data, your DPA is incomplete.

---

## A Practical GDPR Starting Checklist for SaaS Founders

- **Scan your marketing site.** Find every cookie, pixel, and tracker loading with and without consent. You can't fix what you can't see.
- **Implement a proper consent banner** that blocks non-essential scripts before consent is given. Test it in incognito before and after accepting.
- **Draft a DPA template** with a privacy lawyer. Publish it at `/legal/dpa`. Make it your starting point in enterprise negotiations, not theirs.
- **Publish your sub-processor list** — names, locations, and what data each service receives. Link to it from your DPA and privacy policy.
- **Set and document retention policies** for logs, user data, and backups. Write them down, build the deletion automation, and put them in your privacy policy.
- **Create a DSAR intake process** — a public form or email, a designated owner, and a 30-day deadline tracker.
- **Address international data transfers in your DPA.** If you're US-based and processing EU data, incorporate SCCs. Consider EU data residency for customers who require it.

---

## How Custodia Helps SaaS Companies

Several of these requirements are things Custodia handles directly. A few require a legal resource — and we'll say so plainly.

**Website scanner:** Custodia crawls your marketing site like a real EU visitor, detecting every cookie, tracker, pixel, and third-party script — with or without consent. SaaS marketing sites are often the compliance blind spot. You get the full picture in minutes.

**Consent banner:** Generated from your actual scan data, not a template. Blocks non-essential scripts before consent. Jurisdiction-aware (GDPR opt-in for EU, CCPA opt-out for California). Supports Google Consent Mode v2.

**Privacy policy:** AI-generated from your real data practices — specific to the tools you actually use, updated automatically when your site changes.

**DSAR management:** Built-in intake form, deadline tracking, and AI-assisted data discovery. When a request comes in, Custodia helps you find the data, draft the response, and meet the 30-day deadline.

**What Custodia doesn't replace:** A DPA template requires a real privacy lawyer. Sub-processor agreements, SCC incorporation, and international transfer analysis need legal expertise. Custodia handles the ongoing operational and technical layer — the part that benefits most from automation.

Plans start at $29/month.

**[Scan your marketing site free →](https://app.custodia-privacy.com)**

No signup required. See what your marketing site is collecting — and what's firing without consent — in 60 seconds.

---

*Last updated: March 2026*
