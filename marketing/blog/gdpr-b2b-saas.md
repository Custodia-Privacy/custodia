# GDPR for B2B SaaS: The Controller-Processor Relationship Explained

Your B2B SaaS product processes customer data on behalf of your customers. That makes you a processor — with very specific legal obligations that differ fundamentally from those of your customers. If you've been treating GDPR as a single set of rules that applies uniformly to your company, you're missing half the picture. And getting that half wrong creates liability for you and every business that uses your product.

This guide is written specifically for SaaS founders and product teams navigating GDPR B2B SaaS compliance.

---

## The Controller-Processor Split in B2B SaaS

In GDPR terminology, there are two key roles:

- **A data controller** determines the purposes and means of processing personal data. They decide *why* data is collected and *how* it's used.
- **A data processor** processes personal data on behalf of a controller. They act on the controller's instructions.

In B2B SaaS, the split typically looks like this:

Your customer (a business) signs up for your product. They upload their users' data — customer records, employee information, support tickets, whatever your product handles. **Your customer is the controller.** They decided to collect that data, they own the relationship with those individuals, and they're responsible for having a lawful basis for the collection.

**You are the processor.** You store that data, process it according to your product's logic, and make it available to your customer. You're acting on their instructions.

This applies across product categories: CRM tools, analytics platforms, support software, HR systems, project management tools, communication platforms. If your product handles data that belongs to your customer's users, you're a processor for that data.

---

## But You're Also a Controller

Here's where GDPR B2B SaaS gets genuinely complex: you wear both hats simultaneously.

As a **processor**, you handle your customers' end-user data.

As a **controller**, you handle:

- **Account data**: The information your customers share when they sign up — name, email, company, billing details.
- **Marketing data**: Email addresses you collect for newsletters, event registrations, or product updates.
- **Analytics data**: How users interact with your product — feature usage, session data, click patterns.
- **Support data**: Information shared in support tickets or chat conversations with your team.
- **Log data**: Server logs that may contain IP addresses or user identifiers.

For all of this, you are the controller. You decided to collect it. You determine how it's used. You're responsible for a lawful basis, a privacy policy that describes your processing, and responding to data subject requests.

Understanding this dual role is the foundation of GDPR B2B SaaS compliance. Your obligations in each role are different.

---

## What Being a Processor Means

When you're acting as a processor, GDPR Article 28 governs your obligations. Three requirements stand out:

**1. Process only as instructed.** You can only process customer data for the purposes your customer authorizes. This sounds abstract, but it has concrete implications: if you use customer data to train machine learning models, improve your product, or generate aggregate analytics, you need explicit permission. Check your terms of service — many SaaS companies have quietly claimed broad data rights that GDPR doesn't support.

**2. You need a Data Processing Agreement (DPA) with every customer.** This is a legal requirement, not optional. Article 28 mandates a written contract covering specific topics (more on this below).

**3. You're liable for sub-processors.** Every tool in your stack that touches customer data is a sub-processor. You're responsible for their compliance.

---

## The DPA Requirement: What Must Be In Your DPA

A Data Processing Agreement is the contract between you (the processor) and your customer (the controller). GDPR Article 28(3) specifies what it must cover:

- **Subject matter and duration**: What data you're processing and for how long.
- **Nature and purpose**: What you do with the data (store, analyze, transmit, etc.) and why.
- **Type of personal data**: Categories of data involved (names, emails, behavioral data, etc.).
- **Categories of data subjects**: Whose data it is (end users, employees, customers, etc.).
- **Obligations and rights of the controller**: What your customer can instruct you to do.

Beyond those minimum requirements, a well-drafted DPA for GDPR B2B SaaS should cover:

- Confidentiality obligations for your staff
- Security measures (referencing your Article 32 obligations)
- Sub-processor list and change notification procedure
- Assistance with data subject requests
- Breach notification timeline
- Data deletion or return at contract end
- Audit rights

**Should you publish your DPA proactively?** Yes. Enterprise customers will request it before signing. Mid-market buyers will ask during procurement. Publishing it publicly (as a standard clickwrap or PDF download) removes friction and signals compliance maturity. Stripe, AWS, and most SaaS infrastructure providers publish their DPAs openly — follow their lead.

---

## Sub-Processors: Your Stack Is Your Responsibility

Every tool in your infrastructure that touches customer data is a sub-processor. Common examples for a typical GDPR B2B SaaS company:

- **AWS / GCP / Azure** — cloud infrastructure
- **Stripe** — payment processing (handles customer billing data)
- **Intercom / Zendesk** — customer support (may see customer end-user data)
- **Datadog / Sentry** — monitoring and error tracking
- **Segment / Amplitude** — product analytics
- **PlanetScale / Supabase / RDS** — databases

Your GDPR obligations as a processor require you to:

1. Get a DPA from each sub-processor (all major vendors publish these)
2. Disclose your sub-processor list to customers
3. Notify customers when you add or change a sub-processor (typically 30 days' notice in your DPA)
4. Ensure sub-processors are bound by the same data protection obligations you've committed to

Customers have the right to object to new sub-processors. In practice, most won't — but enterprise buyers in regulated industries (finance, healthcare, legal) will scrutinize this list. Maintain it carefully and keep it up to date.

---

## Data Minimisation in Product Design

Article 5(1)(c) requires that personal data be "adequate, relevant and limited to what is necessary in relation to the purposes for which they are processed." For GDPR B2B SaaS, this principle should inform how you build your product.

Practical questions for your product team:

- Does this feature require personally identifiable data, or could it work with aggregated or anonymized data?
- Are we logging user IDs when a session ID would serve the same debugging purpose?
- Does our analytics integration need individual-level data, or would cohort-level data answer the same product questions?
- Are we storing full API request/response payloads (which may contain PII) when we only need error codes?

Data minimisation isn't just a legal checkbox — it reduces your attack surface, simplifies your deletion obligations, and makes DSAR responses easier to fulfill.

---

## Security Obligations Under Article 32

Article 32 requires controllers and processors to implement "appropriate technical and organisational measures" to protect personal data. For a SaaS processor, this typically means:

**Encryption**: Data at rest (AES-256 or equivalent) and in transit (TLS 1.2+). Don't store unencrypted credentials or API keys in your database.

**Access controls**: Role-based access, principle of least privilege, MFA for internal systems. Customer data should never be accessible to support staff by default — access should be logged and require explicit authorization.

**Audit logs**: Maintain logs of who accessed what data and when. This is essential for breach investigation and demonstrating compliance to customers who exercise audit rights.

**Penetration testing**: Regular third-party pen tests, especially before enterprise sales. Many procurement teams require evidence of recent testing.

**Vendor security reviews**: Apply the same scrutiny to your sub-processors that customers apply to you.

**Incident response procedures**: A documented plan for detecting, containing, and reporting breaches. Article 32 requires "a process for regularly testing, assessing and evaluating the effectiveness of technical and organisational measures."

The standard here is proportionality — the measures should match the risk. A GDPR B2B SaaS product handling medical records has higher obligations than one handling project names. But the baseline of encryption, access controls, logging, and testing applies across the board.

---

## Breach Notification: The 72-Hour Chain

GDPR creates a two-step notification chain for data breaches:

**Step 1: You (processor) notify your customer (controller).** Article 33(2) requires processors to notify controllers "without undue delay" after becoming aware of a breach. Your DPA should specify 24-72 hours. Faster is better.

**Step 2: Your customer notifies their supervisory authority.** Article 33(1) gives controllers 72 hours from awareness to notify their competent DPA (Data Protection Authority), unless the breach is "unlikely to result in a risk to the rights and freedoms of natural persons."

The implication for GDPR B2B SaaS: your customer's 72-hour clock starts when they become aware of the breach — which means it effectively starts when you tell them. If you delay notification to investigate, you're eroding their compliance window.

**What your breach notification to customers should include:**
- Nature of the breach (what happened, how many records, what categories of data)
- Likely consequences
- Measures you've taken or propose to take
- Your DPA contact details

You may not have all information immediately. Notify first, update as you learn more.

---

## EU Data Residency: When Customers Demand It

Enterprise customers in regulated European industries increasingly require EU-only data processing. GDPR doesn't mandate EU data residency — it allows transfers to third countries under specific mechanisms (Standard Contractual Clauses, adequacy decisions, etc.) — but enterprise procurement teams often impose stricter requirements.

If you're seeing this demand in sales conversations, you have a few options:

**AWS/GCP/Azure EU regions**: The simplest approach for most GDPR B2B SaaS companies. Deploy your infrastructure in eu-west or eu-central regions, configure your database to stay within EU, and verify that sub-processors (analytics, monitoring, support tools) also process data in the EU.

**The hard part**: Many SaaS tools in your stack don't offer EU-only processing. Intercom, Amplitude, and many others route data through US infrastructure by default. If EU data residency is a hard requirement, you may need alternative tooling or to configure EU data residency settings explicitly (where the vendor supports it).

**What to put in your DPA**: A data residency schedule that specifies exactly which regions data is stored in. Enterprise buyers expect this.

EU data residency can be a competitive differentiator in certain market segments. If you're pursuing European enterprise customers in finance, healthcare, or public sector, investing in it early pays off.

---

## Privacy Policy vs DPA: What Goes Where

A common point of confusion for GDPR B2B SaaS founders:

**Your privacy policy** describes how you process data as a **controller** — your customer account data, marketing list, analytics, etc. It's addressed to your customers (as individuals) and to visitors to your website. It's a public document.

**Your DPA** governs how you process data as a **processor** on behalf of your customers. It's addressed to your customers as businesses. It's a contract.

These serve different purposes and should be separate documents. A DPA is not a substitute for a privacy policy, and a privacy policy is not a DPA.

A well-structured GDPR B2B SaaS compliance posture includes both:
- A privacy policy that covers your controller activities
- A DPA (or Data Processing Addendum) that covers your processor activities
- A sub-processor list linked from your DPA

---

## Practical Checklist: 8 Things Every B2B SaaS Must Have in Place

1. **A published DPA** — Available for customer self-service, covering all Article 28(3) requirements. Don't make procurement teams request it manually.

2. **A current sub-processor list** — Every tool in your stack that touches customer data, with links to their DPAs. Updated whenever you add or change vendors.

3. **A change notification process** — Email or in-app notification to customers before adding new sub-processors (30 days is standard).

4. **Encryption at rest and in transit** — Baseline security for all customer data. Document this in your DPA.

5. **Access controls and audit logging** — Who can access customer data, under what conditions, and a log of that access.

6. **A breach notification procedure** — Written playbook for detecting, containing, and notifying customers within 24 hours.

7. **A DSAR handling process** — When your customer receives a data subject request (deletion, access, portability), they may need to relay it to you. You need a documented process for responding within 30 days.

8. **A data deletion procedure** — At contract end (or upon customer request), you need a process to delete or return customer data. Specify the timeline in your DPA.

---

## Audit Your Own Compliance Posture First

Before you can credibly tell enterprise customers that you take GDPR B2B SaaS compliance seriously, you need to know what your own public-facing infrastructure is doing. Are your marketing site cookies firing before consent? Is your sign-up flow collecting more than you need? Does your privacy policy accurately describe your sub-processors?

[Custodia](https://app.custodia-privacy.com/scan) scans your app's public-facing pages and identifies compliance gaps — missing consent mechanisms, tracker behaviour, policy gaps — in 60 seconds. Free scan, no sign-up required.

Fix your own foundation before the next enterprise prospect asks for your DPA.

---

*Last updated: March 27, 2026. This post provides general information about GDPR B2B SaaS compliance. It does not constitute legal advice. Privacy law is complex and jurisdiction-specific — consult a qualified privacy professional for advice tailored to your situation.*
