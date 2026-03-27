# GDPR and Third-Party Vendors: Managing Data Processor Relationships

Every SaaS tool you add to your website sends personal data somewhere. Your CRM, your email platform, your analytics tool, your chat widget, your payment processor — each one receives personal data about your visitors or customers. Under GDPR, you are responsible for what happens to that data at every one of those vendors. This guide explains how to manage GDPR third-party vendors correctly.

## You Are Responsible for Every Tool You Use

Most businesses focus on their own GDPR compliance — their privacy policy, their cookie banner, their internal data practices. They overlook the fact that GDPR compliance extends to every third party that processes personal data on their behalf.

The regulation is explicit: as a data controller, you must only work with data processors that provide sufficient guarantees about GDPR compliance, you must document those relationships formally, and you must sign a written contract with each one. Failing to do this isn't a technicality — it's a substantive GDPR violation that has resulted in significant enforcement action.

A business with 20 SaaS tools in its stack may have 20 data processors it has never formally assessed. That's the typical situation, and it represents meaningful legal exposure.

## Controller, Processor, Sub-Processor: The Key Distinctions

Before you can manage GDPR third-party vendors correctly, you need to understand the roles:

**Data controller** — The entity that determines the purposes and means of processing personal data. If you run a website and you decide to add Google Analytics, you are the controller for that data collection decision.

**Data processor** — An entity that processes personal data on behalf of a controller, following the controller's instructions. Google Analytics (when properly configured) processes data on your behalf — it follows your configuration choices. The processor doesn't decide why the data is being collected; you do.

**Sub-processor** — A third party that the processor engages to help it fulfil its obligations to you. When Mailchimp uses Amazon Web Services to store email data, AWS is a sub-processor. When HubSpot uses a data centre to host your CRM data, that data centre operator is a sub-processor.

The distinction between controller and processor matters because the obligations differ significantly. With a processor, you maintain overall control and the processor must follow your instructions. Some vendor relationships are actually joint controller arrangements — where both parties independently determine the purposes of processing. We'll come back to that distinction because it has significant practical implications.

**Common examples of processors:** Mailchimp, HubSpot, Intercom, Stripe, Google Analytics, Hotjar, Salesforce, Zendesk, Slack (where employee data is involved), AWS, Google Cloud.

**Common examples that may be joint controllers:** Facebook (when you use the Meta Pixel, Facebook uses that data for its own advertising purposes independently of your instructions), LinkedIn (when using their Insight Tag).

## What GDPR Article 28 Requires

Article 28 of GDPR is the central provision governing data processor relationships. It establishes two core requirements:

**First**, you must only use processors that provide sufficient guarantees to implement appropriate technical and organisational measures, ensuring that processing will meet GDPR requirements and protect data subject rights. This means you need to actually assess your GDPR third-party vendors before using them — not just assume they're compliant because they're a large company.

**Second**, processing by a processor must be governed by a written contract (a Data Processing Agreement, or DPA) that sets out the subject matter and duration of processing, the nature and purpose of processing, the type of personal data and categories of data subjects, and the obligations and rights of the controller.

Article 28 also specifies that the processor must not engage sub-processors without prior written authorisation from the controller — either specific approval for each sub-processor or general written authorisation allowing the processor to use sub-processors (subject to the processor notifying you of changes).

## Data Processing Agreements: What They Must Contain

A DPA is the formal contract you need with each of your data processors. GDPR Article 28(3) specifies what it must include:

- Processing only on documented instructions from the controller
- Confidentiality obligations on persons authorised to process the data
- Implementation of appropriate security measures (Article 32)
- Compliance with sub-processor rules (Article 28(2) and (4))
- Assistance to the controller in responding to data subject rights requests
- Assistance with security obligations, breach notification, PIAs, and prior consultation
- Deletion or return of all personal data at the end of the service
- Provision of all information necessary to demonstrate compliance, and cooperation with audits

Most established SaaS vendors provide a standard DPA that you can sign online or by counter-signing their document. When you're managing GDPR third-party vendors, the first step is to locate the DPA for each vendor and execute it.

For Google, Mailchimp, Stripe, HubSpot, Intercom, and similar platforms, DPAs are typically available in account settings or through a specific link in their privacy documentation. They are often pre-signed by the vendor and require only your acceptance.

**Important:** A DPA buried in a vendor's terms of service that you passively accepted doesn't necessarily satisfy Article 28's requirement for a written contract that reflects the specific relationship. Where possible, execute a dedicated DPA.

## Sub-Processor Chains: When Your Vendor Uses Another Vendor

Sub-processor chains are where GDPR third-party vendor management gets complicated. When you sign a DPA with Mailchimp, you're not just entering into a relationship with Mailchimp — you're indirectly in a relationship with every sub-processor Mailchimp uses, including AWS for infrastructure, analytics vendors for product improvement, and others.

Under GDPR, processors must flow down the same data protection obligations to their sub-processors. If a sub-processor fails to protect data, the original processor remains fully liable to you as the controller.

Your obligations in sub-processor chains:

**Review sub-processor lists.** Major processors publish their sub-processor lists. Before signing with a processor, check whether their sub-processors are acceptable. If a processor uses a sub-processor in a country without an adequacy decision and without appropriate safeguards, that's your problem too.

**Require notification of sub-processor changes.** Your DPA should require the processor to notify you before adding or replacing sub-processors, giving you the right to object to changes that raise legitimate concerns.

**Document the chain.** Your Records of Processing Activities (RoPA) should reflect the sub-processor relationships you're aware of, not just your direct processors.

## How to Audit Your Vendor List: Mapping All Data Processors

The first step in managing GDPR third-party vendors is knowing who they are. Most businesses are surprised by how long the list is when they actually map it out.

**Step 1: Inventory your tools.** List every software tool, platform, and service your business uses that might receive personal data. Think in categories: marketing and CRM, analytics and monitoring, customer support, payments and billing, communications, HR and payroll, cloud infrastructure, productivity tools.

**Step 2: Identify which tools receive personal data.** Not every tool is a data processor. A tool that processes only anonymous or aggregate data isn't a processor for GDPR purposes. Focus on tools that receive names, email addresses, IP addresses, browsing behaviour, financial data, or any other personal data.

**Step 3: Classify each relationship.** For each tool, determine whether it's a processor (follows your instructions), a joint controller (independently determines processing purposes), or a controller in its own right (outside your data processing relationship).

**Step 4: Check DPA status.** For each processor, have you executed a DPA? If not, obtain and sign one.

**Step 5: Check transfer mechanisms.** For processors outside the EU/EEA, or processors using infrastructure outside the EU/EEA, what is the legal basis for the international transfer? Standard Contractual Clauses? Adequacy decision? Something else?

**Step 6: Document everything.** Add each processor to your RoPA with the relevant details.

Custodia can scan your website automatically and identify every third-party connection — scripts, trackers, APIs, and embedded tools — giving you a starting point for your processor inventory.

## Due Diligence Checklist: 8 Questions to Ask Before Using a New Vendor

When evaluating GDPR third-party vendors, run through this checklist before you sign up:

1. **Do they have a DPA available?** If a vendor doesn't offer a DPA, they either don't understand GDPR or aren't willing to accept processor obligations. Both are red flags.

2. **Where is data stored?** EU-based storage is straightforward. US or other non-EU storage requires appropriate transfer mechanisms. Check their privacy documentation carefully.

3. **What sub-processors do they use?** Review their sub-processor list. Are the sub-processors based in countries with adequacy decisions or appropriate safeguards?

4. **What security certifications do they hold?** ISO 27001, SOC 2 Type II, and similar certifications provide some assurance of security practices. Not all processors will have these, but larger ones should.

5. **What is their breach notification process?** Under GDPR, processors must notify you without undue delay after becoming aware of a breach. What does the vendor's process actually look like?

6. **Do they support data subject rights?** If a customer asks you to delete their data, can the vendor delete it from their systems? Can they provide a data export? Ask before you commit.

7. **What is their data retention policy?** Does their default retention period align with your needs? Can data be deleted on request at contract end?

8. **Have they signed their own DPAs with their sub-processors?** You can ask, or check their documentation. If they're using AWS, do they have a DPA with AWS? Most established vendors will.

## High-Risk vs Low-Risk Processors: How to Prioritise

Not all GDPR third-party vendors present equal risk. When resources are limited, prioritise your due diligence based on:

**Volume of data processed.** Your CRM processes more personal data than your project management tool. Prioritise accordingly.

**Sensitivity of data.** Vendors that process financial data, health data, or behavioural profiles represent higher risk than those that process only business contact information.

**Location of processing.** Processors in countries without an EU adequacy decision require additional scrutiny and must have appropriate transfer mechanisms in place.

**Access to production data.** Vendors with direct access to your production databases or customer data represent higher risk than those receiving only aggregated or anonymised data.

**Nature of the relationship.** A core infrastructure vendor (your cloud provider, your database host) is higher risk than a peripheral tool used by one team member occasionally.

High-risk processors warrant deeper due diligence — reviewing their DPA in detail, checking their sub-processor list, verifying their security certifications. Lower-risk processors may be handled more efficiently by confirming a DPA exists and moving on.

## When a Vendor Is a Joint Controller, Not a Processor

The joint controller distinction is one of the most misunderstood aspects of GDPR third-party vendor management, and getting it wrong has serious implications.

A vendor is a **joint controller** when they independently determine the purposes of processing — when they use the data for their own ends, not just to provide you with a service.

The clearest example is the Meta Pixel. When you install the Facebook Pixel on your website, Meta doesn't just collect data on your behalf and follow your instructions. Meta uses that data to build advertising profiles, to train its algorithms, and to improve its own products. That's independent purpose determination. Meta is a joint controller, not a processor.

The implication: with joint controllers, you need a joint controller agreement (under Article 26), not a DPA. The agreement must reflect each party's responsibilities for GDPR compliance. Users must be informed of both controllers. Both parties share liability for the arrangement.

Other situations that may involve joint controllership: LinkedIn Insight Tag, certain analytics tools that aggregate data across customers, some market research platforms.

**The practical test:** Ask whether the vendor uses the personal data only to provide services to you, or whether they use it for their own purposes. If the latter, you're likely looking at a joint controller relationship.

## Standard Contractual Clauses and International Transfers

Many GDPR third-party vendors are based in the United States or operate infrastructure there. The EU-US transfers issue has been turbulent since the Schrems II decision invalidated the Privacy Shield framework in 2020.

The current framework for EU-US transfers is the EU-US Data Privacy Framework (DPF), which the European Commission adopted as adequate in July 2023. US processors that self-certify under the DPF can receive EU personal data without additional safeguards.

However, the DPF's long-term legal stability is uncertain — Schrems III litigation is already underway. Many practitioners recommend maintaining Standard Contractual Clauses (SCCs) as a fallback even when transferring to DPF-certified organisations.

**SCCs** are standardised contract clauses adopted by the European Commission that provide appropriate safeguards for international transfers. Most major US SaaS vendors incorporate SCCs into their DPAs as the transfer mechanism.

The 2021 version of the SCCs (which replaced the 2010 version) also requires a **Transfer Impact Assessment (TIA)** — an evaluation of whether the legal framework of the destination country provides equivalent protection to GDPR. For US transfers, this means assessing the implications of US surveillance laws (like FISA 702) for the data being transferred.

For most small businesses, the practical approach is: execute the DPA with each US processor, confirm that SCCs are included, and document the transfer mechanism in your RoPA. If you're transferring especially sensitive data, a more detailed TIA may be warranted.

## Keeping Your Vendor Register Up to Date: Records of Processing Activities

Your **Records of Processing Activities (RoPA)** is the master document of your data processing operations. Under GDPR Article 30, organisations with more than 250 employees are formally required to maintain one. But even if you're below that threshold, you're required to maintain records if you process data regularly, process data that could result in a risk to individuals, or process special categories of data.

In practice, every business with a functioning website should maintain a RoPA. It's the foundation of your GDPR third-party vendor management system.

For each processing activity involving a data processor, your RoPA should capture:

- Name and contact details of the controller and processor
- The categories of data processed and data subjects involved
- The purpose and legal basis for processing
- Any transfers to third countries and the safeguards in place
- Time limits for erasure (where possible)
- A general description of technical and organisational security measures

The RoPA is a living document, not a one-time exercise. It needs to be updated when you add new tools, change vendors, or change how you use existing tools. Build a review into your business calendar — at minimum, review it quarterly and update whenever you onboard a new data processor.

Treating the RoPA as a static document is one of the most common GDPR third-party vendor management failures. Regulators have found significant violations in organisations whose RoPA didn't reflect their actual processing activities.

---

## Build a Vendor Management Process That Scales

Managing GDPR third-party vendors is an ongoing operational requirement, not a one-time project. Here's a process that works at small business scale:

**Before onboarding any new tool:** Run through the due diligence checklist. Check whether the vendor offers a DPA. Confirm the transfer mechanism if they're outside the EU/EEA. Update your RoPA.

**On a regular basis:** Review your vendor list against your RoPA. Have any tools been added without going through the process? Have any vendors changed their sub-processors or privacy terms? Renew DPAs if they have expiration provisions.

**When you offboard a tool:** Confirm data deletion. Obtain confirmation in writing if possible. Update your RoPA to reflect that processing has ceased.

**When a vendor notifies you of a sub-processor change:** Evaluate the change. If it raises concerns, exercise your right to object under the DPA.

The goal is a vendor management process that catches new data processor relationships before they create compliance gaps — not a post-hoc audit that finds problems after they've already occurred.

---

## Discover Every Third-Party Connection on Your Site Automatically

One of the hardest parts of managing GDPR third-party vendors is knowing which vendors are actually active on your site. Marketing teams add pixels, developers add analytics tools, customer support installs chat widgets — and none of it necessarily goes through a privacy review.

Custodia scans your website and identifies every third-party script, tracker, and data connection in real time. You'll see exactly which vendors are receiving data from your visitors, which are operating without consent, and which ones you may not have formal DPAs with.

[Scan your website free at app.custodia-privacy.com](https://app.custodia-privacy.com/scan) — no signup required, results in 60 seconds.

---

*Last updated: March 27, 2026. This post reflects GDPR requirements as currently enforced. Privacy law is complex and jurisdiction-specific — consult a qualified privacy professional for advice tailored to your situation.*
