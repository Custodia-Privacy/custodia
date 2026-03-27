# GDPR Right to Erasure: What "The Right to Be Forgotten" Actually Requires

*The "right to be forgotten" sounds absolute. It isn't. GDPR's right to erasure has specific conditions, specific exceptions, and a 30-day deadline. Here's what you actually need to do when someone asks you to delete their data.*

---

## What the Right to Erasure Is

Article 17 of GDPR gives individuals the right to request deletion of their personal data. It's not an unlimited right — it applies in specific circumstances. The right to erasure applies when:

- **(a) Data is no longer necessary** for the purpose it was originally collected or processed for
- **(b) The person withdraws consent** and there's no other legal basis for the processing
- **(c) The person objects to processing** under Article 21 and there's no overriding legitimate interest
- **(d) The data was unlawfully processed** — collected or used without a valid legal basis in the first place
- **(e) Erasure is required by EU or member state law** — a specific legal obligation compels deletion
- **(f) The data was collected from a child** for information society services (online services)

If none of these conditions apply, the right to erasure doesn't apply either. Knowing this matters: not every deletion request is one you're legally required to fulfill.

---

## When You Can Refuse

The right to erasure isn't absolute. You can refuse a deletion request when processing is necessary for:

**Freedom of expression and information.** Journalism, academic research, and public interest purposes can override erasure requests in some circumstances.

**Compliance with a legal obligation.** If you're required by law to retain certain data, you don't have to delete it just because someone asks. Tax law is the clearest example: most EU jurisdictions require you to keep invoices, order records, and financial transactions for 7 years. If a customer asks you to delete everything, you can — and should — retain that financial data and explain why.

**Public interest in public health.** Limited to specific contexts like disease surveillance and public health emergencies.

**Archiving, scientific, historical, or statistical purposes.** Data processed for legitimate research purposes has specific protections under GDPR.

**Establishment, exercise, or defense of legal claims.** If you're in a dispute with someone or anticipate litigation involving their data, you can retain relevant information.

The practical upshot: when you receive an erasure request, you don't automatically have to comply with all of it. But you do have to respond within the deadline, and if you're refusing — even partially — you need to explain why.

---

## The 30-Day Deadline

You must respond to an erasure request within **30 calendar days** of receiving it.

If the request is complex or you've received numerous requests simultaneously, you can extend this by up to 2 months — but you must notify the requester within the first 30 days that you're extending, and explain why.

If you refuse the request, you still have to respond within 30 days, explaining:
- That you're not fulfilling the request
- Why (which exception applies)
- That they have the right to complain to a supervisory authority

The 30-day clock starts when you receive the request, not when you verify the person's identity. If identity verification takes time, that's part of your 30 days. Plan accordingly.

---

## What "Erasure" Actually Means in Practice

This is where many businesses get it wrong. "Erasure" under GDPR means the data must be:

- **Deleted** from your systems
- **Destroyed** if it's in physical form
- **Permanently anonymized** — all identifiers removed such that re-identification isn't reasonably possible

What erasure does NOT mean:

**Pseudonymization is not erasure.** Replacing someone's name with a user ID, or swapping their email for a hash, doesn't count. You still have personal data — it's just encoded. If you can re-identify the person from any combination of fields, the data is still personal and hasn't been erased.

**Archiving to cold storage is not erasure.** Moving the data to a backup server, an S3 archive bucket, or a "we might need this later" folder isn't deletion. The data still exists.

**Deleting from your main database but not your backups is a grey area.** GDPR expects you to have a process for handling backup data too. Supervisory authorities have found that a genuine erasure process includes a mechanism for ensuring backup data is eventually purged — whether through scheduled backup rotation, data masking, or another approach. "We deleted it from production but it's still in backups from last week" is not a clean answer.

---

## The Systems Problem

Most businesses have personal data in more than one place. An erasure request doesn't just apply to your main database — it applies everywhere that person's data exists.

A typical small SaaS or e-commerce business has customer data in:

- Main application database (accounts, usage data)
- CRM (Hubspot, Salesforce, Pipedrive)
- Email marketing platform (Mailchimp, Klaviyo, ConvertKit)
- Customer support tool (Intercom, Zendesk, Freshdesk)
- Payment processor (Stripe, PayPal — though financial records have legal retention requirements)
- Analytics (Google Analytics — though this is typically not tied to identifiable individuals if configured correctly)
- Database backups
- Email archives (support threads, sales correspondence)
- Internal spreadsheets and documents

This is the practical challenge. Your email platform has their contact record. Your CRM has their deal history. Your support tool has three years of conversations. Each system requires a separate deletion action, and some systems make this harder than others.

You need a map of your systems before you can execute an erasure request reliably.

---

## How to Handle an Erasure Request Step by Step

### Step 1: Verify Identity

Don't delete data based on an unverified email request. Someone could request deletion of another person's data. Require enough verification to be confident you're dealing with the actual data subject — usually confirming details that only they would know, or verifying via a logged-in account.

### Step 2: Check Whether Any Exception Applies

Before doing anything else, review whether you have a legal obligation to retain the data (financial records, regulatory requirements), or whether you have legal claims involving this person that require data retention. Document your analysis.

### Step 3: Identify All Systems Containing Their Data

This requires knowing your data map. Go through every system and database where this person's data might live. This is harder than it sounds if you haven't done a data inventory.

### Step 4: Delete From Each System — or Document Why You Can't

Execute deletion in each system where no exception applies. For systems where you're retaining data under an exception, document which exception and why. Financial records under a 7-year legal retention requirement: document that. Legal claim involvement: document that.

### Step 5: Respond to the Requester

Confirm deletion (or your partial refusal with reasons) in writing. Keep the response clear. If you deleted everything: say so. If you retained some data: explain specifically what you retained and why.

### Step 6: Document the Entire Request and Response

Keep a record of: when the request came in, who verified identity and how, what systems you checked, what was deleted, what was retained and under which exception, and when and how you responded. This documentation is your defense if the requester files a complaint with a supervisory authority.

---

## Third Parties and Sub-processors

If you've shared the person's data with third parties, Article 17(2) requires you to notify those parties of the erasure request and take reasonable steps to ensure they also erase the data.

**Direct processors** (tools that process data on your behalf): You should delete the contact or data record. If you use Mailchimp, delete the contact. If you use Intercom, delete the user. These are your processors — you control the data in their systems.

**Third parties you've disclosed data to:** This gets more complicated. If you've shared data with a referral partner or another company as a controller in their own right, you need to notify them of the erasure request and ask them to comply.

**Advertising platforms:** If you've shared data with ad platforms (Meta, Google) via tracking pixels, the practical step is to use their data deletion request tools. Meta and Google have processes for this.

What "reasonable steps" means varies by context. The key is that you can't just delete from your own systems and ignore the downstream chain.

---

## Setting Up an Erasure Process

If you don't currently have a formal erasure process, the place to start is knowing what data your site collects and where it goes. You can't execute an erasure request reliably if you don't have a data inventory.

**[Run a free scan at app.custodia-privacy.com/scan](https://app.custodia-privacy.com/scan)** to identify all the systems, cookies, and third-party data flows on your site — that's the foundation of the map you need. Knowing what's being collected and by whom is the prerequisite for handling any DSAR, including erasure requests.

Custodia's DSAR management handles the full request lifecycle: identity verification, request tracking, deadline monitoring, and response documentation — so nothing falls through the cracks when an erasure request arrives.

---

*Last updated: March 2026*
