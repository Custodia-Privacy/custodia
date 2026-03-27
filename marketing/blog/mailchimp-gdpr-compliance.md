# Mailchimp and GDPR: What You Actually Need to Do for Compliance

*Mailchimp is GDPR-compliant as a platform. Whether your Mailchimp account is being used compliantly is a different question — and one most users haven't thought carefully about.*

---

## Mailchimp's Position as a Data Processor

Mailchimp (owned by Intuit) has done the work on its side of the compliance equation. The platform offers a signed Data Processing Agreement, EU-US Data Privacy Framework certification, Standard Contractual Clauses for international data transfers, and EU data center options for accounts that need them.

What that means in plain terms: Mailchimp has the legal infrastructure in place to receive and process personal data from EU residents on your behalf.

The operative phrase is "on your behalf." As the business using Mailchimp to send emails, you are the **data controller** — you decide whose data goes in, why, and what gets sent. Mailchimp is the **data processor** — it follows your instructions. Mailchimp's GDPR compliance doesn't transfer to your account. It just means your processor is doing its job. Whether you're doing yours is a separate question.

---

## The 5 Mailchimp GDPR Settings That Matter

Mailchimp has built GDPR-specific features directly into the platform. Most users ignore them. Here's what each one does and why it matters.

### 1. GDPR Opt-In Fields

Mailchimp lets you add GDPR marketing permission fields to your signup forms. These are distinct from the standard "subscribe" checkbox — they record specific, granular consent: email marketing, profiling, personalization. Each permission is stored separately against the contact record.

To enable them: go to your Audience, select **Signup forms**, and look for the GDPR fields section. Enable the ones relevant to what you're doing with subscriber data.

If you're not using these fields, you have no structured record of what a subscriber actually agreed to.

### 2. Legal Basis

In Mailchimp's Audience settings, you can set the legal basis for processing each audience. Options match GDPR's six lawful bases: Consent, Legitimate Interest, Contract, Legal Obligation, Public Task, Vital Interest.

For most email marketing lists, the correct basis is **Consent**. If you're emailing existing customers about their account or a service they've purchased, **Contract** or **Legitimate Interest** may apply — but document your reasoning.

Setting this correctly matters both for your own records and for any audit or complaint response.

### 3. Double Opt-In

Mailchimp's confirmed opt-in (double opt-in) sends a confirmation email before adding someone to your list. They're not added until they click the confirmation link.

For EU audiences, double opt-in is the right choice. It creates an automatic timestamp and confirmation trail — evidence that the subscriber actively confirmed their consent, not just that someone typed in an address.

Enable it under: Audience → Settings → Audience name and defaults → Enable double opt-in.

### 4. Signup Form Language

The consent notice on your signup form must be specific. It needs to say who is collecting the data, what it will be used for, and reference your privacy policy. "Subscribe to our newsletter" is not a valid consent statement under GDPR.

Good example: *"By submitting this form, you agree to receive marketing emails from [Company Name]. We'll send you [content type] approximately [frequency]. You can unsubscribe at any time. Read our [Privacy Policy]."*

Vague or misleading consent language is one of the most common GDPR violations in email marketing.

### 5. Unsubscribe Settings

Under GDPR (and increasingly CAN-SPAM and other laws), unsubscribes must be processed immediately and without friction. Mailchimp handles one-click unsubscribe by default through its email footer — don't remove it, don't obscure it, and don't build workflows that resubscribe contacts who've opted out.

Check that all your active campaigns include the unsubscribe link and that your confirmation page is functioning correctly.

---

## What Mailchimp's GDPR Consent Fields Actually Do

Mailchimp's GDPR marketing permissions fields are worth understanding in detail, because they do something specific that a standard email subscription doesn't.

When a contact subscribes through a form with GDPR fields enabled, Mailchimp records which specific permissions they agreed to — for example, "consent to receive email marketing" and "consent to data analysis for personalization" as separate items, each with a timestamp and the form source.

These permissions appear directly in the contact record. When you view a contact in Mailchimp, you can see exactly what they consented to and when.

Why this matters: if you ever receive a data subject access request (DSAR) or face a complaint to a data protection authority, this record is your evidence. Without these fields, you have a subscribed/unsubscribed binary and no audit trail.

If you're running any marketing to EU contacts and haven't enabled GDPR fields, add them to your forms now.

---

## Building Your Subscriber List Correctly

The rules for adding EU residents to your Mailchimp list are clear. Here's the right approach and the things that will get you in trouble.

**What's required for EU subscribers:**

- Explicit opt-in using an unchecked checkbox with clear, specific consent language
- Record of the date, source, and content of consent
- No pre-ticked boxes, implied consent, or bundled terms

**What will cause problems:**

- Importing lists without documented consent for email marketing specifically
- Purchasing lists (a GDPR violation regardless of what the list seller claims)
- Adding contacts who gave you their email for another purpose (a download, a quote request) to your marketing list without separate consent

**The right implementation:** Create a Mailchimp embedded form with GDPR fields enabled, deploy it on your site, and use double opt-in. This gives you form submissions, confirmation timestamps, and Mailchimp's GDPR permission records all in one.

---

## Re-Permission for Existing Lists

If you have contacts in your Mailchimp audience whose original opt-in is unclear — you migrated from another platform, inherited a list, built it before GDPR took effect — you need to address this.

Running with unverified consent is ongoing exposure. The fix is a re-permission campaign.

Send a targeted email to the contacts in question asking them to confirm their subscription. Keep the email simple: explain what they subscribed to, what you'll send, and include a clear confirmation button. Remove everyone who doesn't respond within a reasonable window — 30 days is common.

Yes, this shrinks your list. A smaller list of people who actually consented is worth more than a larger list of people who might file a complaint.

After running the campaign, archive or delete the non-responders from your Mailchimp audience. Don't just unsubscribe them — remove the data if you have no other legal basis to hold it.

---

## Mailchimp Data Retention

Mailchimp keeps contact data indefinitely by default. An unsubscribed contact's record — name, email, activity history — stays in your audience until you delete it.

Under GDPR's storage limitation principle, you should only retain personal data for as long as necessary for the purpose it was collected. For unsubscribed contacts, that purpose (email marketing) no longer exists. A reasonable approach: delete or archive contacts who have been unsubscribed for an extended period, commonly 12–24 months.

Mailchimp lets you filter by subscription status and date, then export and delete the resulting segment. Build this into your annual compliance review as a standing task.

One note: if you're required to retain certain records for legal or tax purposes, that may justify keeping some data longer — but email subscriber history typically isn't in that category.

---

## The Website/Mailchimp Connection

If you embed a Mailchimp signup form on your website, Mailchimp loads its tracking script (`mc.us.js`) on your pages. This script may set cookies and collect behavioral data.

For EU visitors, this creates a consent requirement: the Mailchimp script shouldn't load before the visitor has consented to marketing cookies.

This is handled at the consent management layer — your cookie consent platform needs to block the Mailchimp embed from loading until the visitor accepts marketing cookies. If you're using Mailchimp's hosted landing pages instead of embedded forms, the same issue applies to any Mailchimp tracking on those pages.

Run a scan of your site to check whether Mailchimp scripts are loading before consent. It's a common gap, especially when forms are embedded through a page builder or theme component that loads synchronously.

---

## Scan Your Site First

Before you work through your Mailchimp audience settings, check what's happening on your website. Custodia's free scanner detects Mailchimp scripts running on your site and whether they're gated on consent — along with every other tracker, cookie, and third-party service your site is sending data to.

[Scan your site at app.custodia-privacy.com/scan](https://app.custodia-privacy.com/scan) — no signup required, results in 60 seconds. Then use this guide to audit your Mailchimp account settings.

---

*Last updated: March 2026*
