# Data Processing Agreement (DPA): What It Is, Who Needs One, and What to Include

*If you use any SaaS tool that handles customer data, you probably need a Data Processing Agreement. Most businesses either don't have them or don't know they do.*

---

## What Is a Data Processing Agreement?

A Data Processing Agreement (DPA) is a legally binding contract between two parties: a **data controller** (the business deciding how data is used) and a **data processor** (a vendor or service processing data on the controller's behalf).

Under GDPR Article 28, entering into a DPA with every processor you use isn't optional — it's a legal requirement. The DPA specifies what data is processed, why, how it's protected, and what the processor's obligations are.

The good news: a DPA doesn't have to be a 40-page legal document. Most reputable SaaS companies already have standard DPAs you can sign in minutes. You don't need to draft one from scratch for every vendor relationship.

What you do need to do is actually have them in place.

---

## Controller vs. Processor — The Distinction That Matters

Before you can identify which DPAs you need, you need to understand the two roles GDPR defines.

**Data controller:** The entity that determines the purposes and means of processing personal data. This is typically you — the business. You decide why you're collecting email addresses, what you're doing with analytics data, how long you retain customer records.

**Data processor:** The entity that processes personal data on behalf of the controller, following the controller's instructions. This is Stripe when it handles your payment data. Mailchimp when it stores your mailing list. Intercom when it logs your customer conversations. AWS when it stores your database.

The distinction matters because GDPR requires the controller to enter into a written agreement with every processor. If you're the business, you're the controller — and your SaaS vendors are your processors.

You need a DPA with every processor that handles personal data from your customers or website visitors.

---

## Who Needs a DPA?

If you use any of the following tools with personal data flowing through them, you need a DPA:

**Email marketing:** Mailchimp, Klaviyo, ConvertKit, ActiveCampaign, Brevo

**Analytics:** Google Analytics, Mixpanel, Amplitude, Heap, Hotjar

**Customer support:** Intercom, Zendesk, Freshdesk, Help Scout, Crisp

**Payments:** Stripe, PayPal, Paddle, Braintree

**CRM:** HubSpot, Salesforce, Pipedrive, Close

**Hosting and infrastructure:** AWS, Google Cloud, Azure, Cloudflare, Vercel, Heroku

**Form and survey tools:** Typeform, WPForms, Jotform, Tally

The honest answer: if you're running any kind of online business and you're using SaaS tools — which you are — you almost certainly need DPAs in place. The only exception would be a tool that processes zero personal data, which almost no useful SaaS tool qualifies for.

Most businesses fall into one of two failure modes: they don't have DPAs at all, or they have one with Stripe and assume that covers everything. Neither is sufficient.

---

## What a DPA Must Include (GDPR Article 28)

GDPR Article 28 defines the minimum required content for a DPA. A valid DPA must cover:

**Subject matter and duration of processing** — What data is being processed and for how long. This is typically tied to the duration of your service contract.

**Nature and purpose of processing** — Why the processor is handling the data and what operations are performed (storing, analyzing, transmitting, etc.).

**Type of personal data and categories of data subjects** — Specific categories: names, email addresses, payment data, behavioral data, location data. And who the data subjects are: customers, website visitors, employees.

**Processor's obligations and rights**, specifically:

- Process personal data only on documented instructions from the controller
- Ensure that people with access to the data are bound by confidentiality
- Implement appropriate security measures (GDPR Article 32)
- Assist the controller with data subject requests (access, deletion, correction)
- Delete or return all personal data at the end of the service relationship
- Provide the controller with all information needed to demonstrate compliance
- Allow for and contribute to audits

**Sub-processor rules** — The processor must get controller approval before engaging sub-processors and must flow down equivalent obligations.

A DPA missing any of these elements is incomplete under GDPR standards. When reviewing DPAs from vendors, check that each element is addressed.

---

## How to Get DPAs with Your Vendors

The practical process is straightforward. Most major SaaS companies handle thousands of DPA requests and have a self-serve process.

**Step 1: Check the vendor's privacy or legal page.** Look for links labeled "Data Processing Addendum," "DPA," "GDPR," or "Legal." Most enterprise-grade tools list it directly there.

**Step 2: Search Google.** Try "[vendor name] DPA" or "[vendor name] data processing agreement." This usually surfaces the right page immediately.

**Step 3: For Google services** — sign into your Google Admin Console, navigate to Account → Legal → Data Processing Amendment, and sign electronically.

**Step 4: For cloud providers** — AWS, GCP, and Azure all have DPAs available through their compliance portals. AWS calls it a "Data Processing Addendum" and it's included automatically for certain services; check the AWS GDPR page for details.

**Step 5: If you can't find it** — email legal@[vendor.com] and request their standard DPA. Larger vendors respond quickly; smaller ones may need a follow-up.

Keep records of all signed DPAs. A simple spreadsheet tracking vendor, DPA date, and renewal date is sufficient. Custodia's compliance dashboard can track this automatically.

---

## Sub-processors — The Hidden Complexity

Here's where most businesses underestimate the scope of the problem.

Your processor (Intercom, for example) doesn't operate in isolation. It uses its own vendors — AWS to host data, Segment for analytics, other services for email delivery. Those are **sub-processors**: third parties that your processor uses to provide the service.

Under GDPR, your DPA with the processor needs to cover sub-processor relationships. Specifically, a compliant DPA requires the processor to:

- **Maintain a list of sub-processors** and make it available to you
- **Notify you of sub-processor changes** before they take effect (typically 30 days advance notice)
- **Get your authorization** before engaging a new sub-processor, or at minimum give you an opt-out window
- **Ensure sub-processors are bound by the same obligations** as the processor itself

When you receive a DPA from a vendor, check that it includes a sub-processor policy. If it doesn't, that's a gap worth flagging. Most established SaaS companies already publish their sub-processor lists at `/legal/sub-processors` or similar.

---

## Common DPA Mistakes

**Not having DPAs at all.** This is the most common one. Businesses run for years on tools that handle thousands of customer records without ever establishing formal processor agreements. The risk is real — any regulatory inquiry or data breach will expose this gap immediately.

**Having a DPA with only one or two vendors.** You signed a DPA with Stripe. Great. You still need them for every other vendor that touches personal data. Stripe is one processor; most businesses have ten or more.

**Not tracking what data each processor handles.** A DPA is only useful if it accurately describes the data involved. If your DPA with your analytics vendor says it processes "behavioral data" but you're also passing customer email addresses to it via user identification, the DPA is incomplete.

**Not reviewing DPAs when you add new tools.** Every time you add a new SaaS tool that handles personal data, you need to check whether a DPA is required and, if so, get one in place before you start processing.

---

## How to Audit Your Current Processor Relationships

The first step is knowing what tools you're actually running. Most businesses are surprised when they see the full list.

Run a free scan at [app.custodia-privacy.com/scan](https://app.custodia-privacy.com/scan) — it identifies third-party tools and data flows detected on your website. From that list, you can work through each tool to confirm whether a DPA is in place.

For each processor identified:

1. Check whether you have a signed DPA
2. If not, find the vendor's DPA and sign it (usually takes under 5 minutes)
3. Record the signed DPA in your compliance tracker
4. Note any sub-processor lists and set a reminder to review them periodically

Custodia's compliance dashboard tracks your processor inventory and DPA status automatically — so when you add a new tool, you're reminded to establish the agreement before you start processing data.

Most businesses can get their DPAs in order in an afternoon. The gap between "we don't have these" and "we have them all" is mostly time, not complexity.

---

*Last updated: March 2026*
