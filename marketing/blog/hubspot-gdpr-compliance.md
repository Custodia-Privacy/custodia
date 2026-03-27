# HubSpot GDPR Compliance: Configuring Your CRM and Marketing Tools Correctly

*HubSpot has built-in GDPR features. Most HubSpot users don't use them correctly — or don't know which settings actually matter. Here's what to configure and why.*

---

## HubSpot as a Data Processor

Under GDPR, there are two distinct roles: data controllers and data processors. HubSpot is your data processor. You — the company using HubSpot to collect, store, and market to contacts — are the data controller.

HubSpot has done its part. They offer a Data Processing Agreement (DPA) that covers their role as your processor. They operate data centers in both the US and EU (you can request EU data residency on some plans). They publish a detailed security and compliance program. They've built a range of GDPR-specific features into the platform.

What this means in practice: HubSpot, as a processor, is compliant. Your use of HubSpot is your responsibility. The settings you choose, the legal bases you select, the consent you collect (or fail to collect), the data you retain — that's all on you.

A DPA with HubSpot doesn't make you GDPR compliant. It's a prerequisite. The rest depends on how you configure and operate the platform.

---

## The GDPR Features HubSpot Provides

Before getting into configuration, it's worth being honest about what HubSpot actually offers and where its limits are.

**What HubSpot provides:**

- **GDPR consent checkboxes on forms** — You can add "consent to process" and "consent to communicate" checkboxes to any HubSpot form.
- **Consent-to-process tracking per contact** — HubSpot logs the legal basis and consent status on each contact record when forms are configured correctly.
- **Communication preferences center** — Contacts can manage their subscription preferences without unsubscribing entirely.
- **Cookie consent banner** — HubSpot includes a basic cookie consent tool that can block the HubSpot tracking script until consent is given.
- **Data deletion tools** — You can delete contacts and their associated data from within HubSpot.
- **Data export for DSARs** — HubSpot lets you export all data associated with a contact, which is useful for handling Data Subject Access Requests.
- **GDPR data request management** — Available in HubSpot Service Hub, this gives you a structured way to receive and track DSAR submissions.

**What HubSpot doesn't do for you:**

- Configure any of the above correctly. Out of the box, most of these features are disabled or set to defaults that don't meet GDPR requirements.
- Block other third-party scripts on your site before consent fires — HubSpot's banner only controls HubSpot's own tracking code.
- Enforce data retention limits. HubSpot keeps contact data indefinitely unless you set up workflows to purge it.
- Handle DSARs across your other systems. HubSpot only covers HubSpot data.

---

## The 5 HubSpot Settings You Need to Configure

### 1. Settings → Privacy & Consent

This is the master switch. In your HubSpot portal, go to **Settings → Privacy & Consent** (under Account Defaults). Enable GDPR features. This unlocks consent checkboxes on forms, legal basis tracking on contact records, and the cookie consent banner.

While you're here, set your default legal basis. This determines what legal basis HubSpot records when contacts submit forms. You can override this at the individual form level — which you should.

### 2. Forms: consent to process and consent to communicate

Every lead generation form on your site needs two things added:

- **Consent to process:** A checkbox that says something like "I agree to [Company] processing my personal data in accordance with its Privacy Policy." This records your legal basis for storing and using the contact's data.
- **Consent to communicate:** A checkbox that says "I agree to receive marketing communications from [Company]." This is your permission to send marketing emails.

Both checkboxes need to be unchecked by default. Pre-checked boxes are not valid consent under GDPR.

Go to each form in HubSpot's form editor, scroll down to the GDPR options section, and add both checkboxes. Write clear, specific consent language — vague wording weakens your consent record.

### 3. Cookie consent: HubSpot's tool or your own CMP

HubSpot's cookie consent tool lives under **Settings → Privacy & Consent → Cookie Consent**. Enable it and configure it to block HubSpot's tracking script (`hs-script-loader`) until consent is given.

This is the minimum. If your site also loads Google Analytics, Meta Pixel, Hotjar, or any other non-essential scripts, HubSpot's banner won't control those. For full compliance on a site with multiple tracking tools, you need a Consent Management Platform (CMP) that can block all non-essential scripts before consent — not just HubSpot's.

### 4. Contact records: legal basis tracking

When your forms are configured correctly with consent checkboxes and legal basis settings, HubSpot automatically logs this information on each contact record. You'll see a "Legal basis for processing contact's data" section in the contact record under "Consent."

Spot-check a few contact records after you configure your forms to confirm the legal basis is being recorded. If it's blank, your forms aren't configured correctly.

### 5. Communication subscriptions

Set up subscription types in **Settings → Marketing → Email → Subscriptions**. This determines what contacts see when they manage their communication preferences. You want subscription types that match the kinds of emails you actually send — product updates, marketing emails, newsletters, etc. — so contacts can opt out of specific types without fully unsubscribing.

This also lets you honor opt-outs correctly. If someone unsubscribes from marketing emails, they shouldn't stop receiving transactional emails like receipts or account notifications.

---

## Legal Basis in HubSpot

HubSpot lets you set a legal basis per form submission. The two most relevant options for most businesses are **consent** and **legitimate interest**.

**Consent** means the contact actively agreed to the specific processing. For marketing emails to new contacts who've never done business with you, consent is the safest basis. It's unambiguous, it's documented, and it's what most regulators expect to see for direct marketing.

**Legitimate interest** is more nuanced. It applies when you have a genuine business reason to process data that doesn't override the contact's privacy rights. Common legitimate interest scenarios: following up with someone who attended your webinar, sending a product update to existing paying customers, or reaching out to a business contact who gave you their card at a conference.

The choice matters because it's recorded on the contact record. If a supervisory authority investigates a complaint, that record is your evidence. "Legitimate interest" without a documented Legitimate Interests Assessment (LIA) is a weak defense. "Consent" with a clear checkbox and specific consent language is solid.

**The practical guidance:** Use consent as your default for new contacts via forms. Use legitimate interest for existing customers where you have a clear, documented rationale. When in doubt, consent is safer.

---

## HubSpot Tracking Code and Cookie Consent

HubSpot's tracking code (`hs-script-loader`) does several things: it tracks page views, identifies known contacts when they visit your site, enables chat widgets, and powers HubSpot's analytics. For EU visitors under GDPR, none of that can happen before the visitor has consented to non-essential cookies.

HubSpot's own cookie consent banner can block `hs-script-loader` until consent is given. That covers HubSpot's own tracking.

But most websites using HubSpot are also running other scripts: Google Analytics, Google Ads, Meta Pixel, LinkedIn Insight Tag, Hotjar, Intercom. None of those are controlled by HubSpot's banner.

If you have HubSpot tracking plus any other non-essential scripts, you need a proper CMP that:

- Blocks all non-essential scripts before consent
- Gives visitors a genuine choice (not just an "Accept" button)
- Records consent and respects it across sessions
- Integrates with Google Consent Mode v2 if you run Google Ads or GA4

HubSpot's cookie tool alone won't do this. It's a starting point for sites that only load HubSpot — which is rare.

---

## The Data Retention Problem

GDPR's storage limitation principle requires that you don't keep personal data longer than necessary for its original purpose. HubSpot's default behavior is to keep contact data indefinitely. That's not GDPR-compliant.

You need to define retention periods and enforce them. HubSpot doesn't do this automatically — you need to build workflows or run manual processes to identify and purge contacts you no longer need.

**Where to start:**

- **Contacts who haven't engaged in 2+ years:** If someone hasn't opened an email, visited your site, or otherwise interacted in years, what legitimate basis do you have to keep their data?
- **Unsubscribed contacts:** Once someone unsubscribes, the legal basis for keeping their data as a marketing contact weakens considerably. Define a retention period — typically 12–24 months — after which you delete or anonymize.
- **Contacts from discontinued campaigns or products:** If you ran a campaign two years ago and those contacts have no ongoing relationship with your business, purge them.

The practical approach: create a HubSpot workflow that flags contacts meeting your "inactive" criteria, sends one final re-engagement email (with a clear "keep me subscribed" CTA), and deletes contacts who don't respond. Run it on a schedule — quarterly or annually.

---

## Handling DSARs Through HubSpot

HubSpot has basic DSAR tooling. On any contact record, you can export all data associated with that contact (go to **Actions → Export contact data**) and submit a deletion request (**Actions → Delete contact**). HubSpot Service Hub adds a more structured DSAR intake form that routes requests into a pipeline.

This covers what HubSpot holds. The problem is that a complete DSAR response needs to cover every system where that person's data lives.

If someone requests all their data, you need to check:

- **HubSpot** — CRM data, email history, form submissions, page views
- **Your email platform** — if you use Mailchimp, ActiveCampaign, or another tool alongside HubSpot
- **Your payment processor** — Stripe, Paddle, or whoever handles billing
- **Your support tool** — Zendesk, Intercom, Freshdesk
- **Your analytics platform** — GA4, Mixpanel, or similar
- **Any other SaaS tool** that has received data about this person

HubSpot's export covers HubSpot. The other systems require their own exports. A DSAR is a process across your entire stack, not a single button in your CRM.

Build a DSAR checklist that names every system in your stack and the steps to retrieve or delete data from each one. That checklist is what turns a regulatory obligation into a manageable operational task.

---

## Start With a Site Scan

Before you configure HubSpot's GDPR settings, get a clear picture of what's actually loading on your site. The HubSpot tracking script is one of many — you may also have Intercom, Hotjar, LinkedIn Insight Tag, Meta Pixel, or ad retargeting scripts that also need to be blocked before consent.

Run a free scan at [app.custodia-privacy.com/scan](https://app.custodia-privacy.com/scan). The scanner loads your site the way a real visitor does and captures every cookie, tracker, and third-party connection that fires on page load — including ones you may have forgotten about or didn't know were running.

That scan gives you the complete picture before you decide on a consent management approach. If your site only loads HubSpot's tracking code, HubSpot's native banner may be sufficient. If you have six other scripts firing alongside it, you need something more robust. Start with the scan to know which situation you're in.

---

*Last updated: March 2026*
