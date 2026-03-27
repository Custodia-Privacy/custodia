---
title: "GDPR International Data Transfers: SCCs, Adequacy, and What's Changed"
description: "GDPR Chapter V restricts international data transfers. This guide covers adequacy decisions, Standard Contractual Clauses, the EU-US Data Privacy Framework, Transfer Impact Assessments, and practical steps for businesses using US cloud services."
date: "March 27, 2026"
tags: ["GDPR", "Data Transfers", "SCCs"]
canonical: "https://app.custodia-privacy.com/blog/gdpr-international-data-transfers"
---

# GDPR International Data Transfers: SCCs, Adequacy, and What's Changed

Every time you use AWS to host EU customer data, send a support ticket to a US helpdesk, or sync contacts to Salesforce, GDPR's international data transfer rules apply. Most businesses using US SaaS tools are transferring EU personal data outside the European Economic Area — and many are doing it without the legal safeguards GDPR requires.

GDPR international data transfers are one of the most complex areas of EU privacy law. The rules have been upended twice in recent years — first by the Schrems II ruling in 2020, which invalidated the EU-US Privacy Shield, then by the EU-US Data Privacy Framework in 2023, which restored a pathway for US transfers. But the legal landscape is still contested, and businesses that assume their tools are compliant by default are taking a significant risk.

This guide explains the current state of GDPR international data transfers: what the law requires, which mechanisms are available, what changed after Schrems II, and what practical steps you need to take.

---

## What Counts as an International Data Transfer Under GDPR

GDPR Chapter V governs transfers of personal data to "third countries" — any country outside the European Economic Area (EU member states plus Iceland, Liechtenstein, and Norway). A transfer occurs whenever personal data moves from an EEA entity to a recipient in a third country, or is accessed from a third country.

This is broader than most businesses realise. GDPR international data transfers include:

- Storing EU customer data on US cloud infrastructure (AWS, Azure, Google Cloud)
- Using US-based SaaS platforms (Salesforce, HubSpot, Mailchimp) that process EU personal data
- Remote access by staff or contractors in non-EEA countries
- Sending emails with personal data to recipients outside the EEA
- API calls that send EU personal data to third-country servers

The rule applies to data controllers (the business that determines how data is used) and data processors (vendors that process data on your behalf). If your processor transfers data onwards — to a sub-processor in a third country — those "onward transfers" must also comply with GDPR Chapter V.

---

## Adequacy Decisions: The Easiest Transfer Mechanism

The simplest way to handle GDPR international data transfers is to transfer data to a country that has received an "adequacy decision" from the European Commission. An adequacy decision means the Commission has determined that the country provides a level of data protection essentially equivalent to the EU.

When an adequacy decision is in place, transfers to that country require no additional safeguards — they are treated as if they were transfers within the EEA.

As of 2026, countries with EU adequacy decisions include:

- **United Kingdom** — received adequacy post-Brexit in 2021 (under review, renewal expected)
- **Canada** — partial adequacy under PIPEDA (commercial organisations only)
- **Switzerland** — adequacy decision in place
- **Japan** — mutual adequacy since 2019
- **Israel** — long-standing adequacy decision
- **New Zealand** — adequacy decision in place
- **Republic of Korea (South Korea)** — adequacy decision granted 2021
- **Argentina** — adequacy decision in place
- **Andorra, Faroe Islands, Guernsey, Isle of Man, Jersey, Uruguay** — also have adequacy

The United States no longer has blanket adequacy. Instead, organisations certified under the EU-US Data Privacy Framework can receive EU personal data — see the dedicated section below.

Adequacy decisions can be revoked or expire. The UK's adequacy is subject to ongoing review. Always check the European Commission's current list before assuming adequacy applies.

---

## Standard Contractual Clauses (SCCs): The Main Safeguard for Most Businesses

For transfers to countries without an adequacy decision — including most transfers to the United States — Standard Contractual Clauses are the most commonly used legal safeguard.

SCCs are pre-approved contractual clauses issued by the European Commission. When incorporated into contracts between EU data exporters and non-EEA data importers, they create binding obligations on both parties that are designed to protect personal data to GDPR standards.

### The 2021 Updated SCCs

The original SCCs dated from 2001–2010. The Commission adopted revised, modernised SCCs in June 2021, which came into mandatory effect in December 2022. All contracts relying on the old SCCs should have been updated by now.

The 2021 SCCs introduced a modular approach with four modules:

- **Module 1:** Controller to Controller (C2C) — your business to a non-EEA business that also determines how data is used
- **Module 2:** Controller to Processor (C2P) — your business to a non-EEA vendor processing data on your behalf
- **Module 3:** Processor to Processor (P2P) — a non-EEA processor passing data to a sub-processor
- **Module 4:** Processor to Controller (P2C) — a non-EEA processor returning data to the controller

Most GDPR international data transfers involving US SaaS tools use Module 2 (your business as controller, the SaaS vendor as processor).

### How to Use SCCs

1. **Identify the correct module** based on whether you are a controller or processor, and the role of the recipient
2. **Execute the SCCs** as part of your Data Processing Agreement (DPA) with the vendor — most major US vendors (AWS, Google, Salesforce, HubSpot, Mailchimp) have pre-completed SCCs available in their DPA or privacy supplement
3. **Complete the Annexes** — SCCs require you to specify the categories of data, purposes of processing, technical and organisational measures (TOMs), and sub-processors
4. **Conduct a Transfer Impact Assessment** — since Schrems II, SCCs alone may not be sufficient; you must assess whether the destination country's laws undermine the protections (see TIA section below)

---

## The EU-US Data Privacy Framework (2023)

The EU-US Data Privacy Framework (DPF) is the successor to the Privacy Shield, which was invalidated by the Schrems II ruling in July 2020. The DPF came into effect in July 2023, following Executive Order 14086 signed by President Biden, which created new oversight mechanisms for US signals intelligence.

Under the DPF, US organisations can self-certify with the US Department of Commerce to receive EU personal data without needing SCCs or other additional safeguards. The Commission issued an adequacy decision for DPF-certified organisations in July 2023.

### Who Can Self-Certify

US companies subject to the jurisdiction of the Federal Trade Commission (FTC) or Department of Transportation (DoT) can certify under the DPF. This includes most US commercial organisations. Financial institutions subject to GLBA and telecoms subject to the Communications Act are currently excluded.

To certify, organisations must:
- Adopt a DPF-compliant privacy policy
- Commit to the DPF Principles (notice, choice, accountability for onward transfers, security, data integrity, access, recourse)
- Register with the DoC and pay an annual fee
- Designate an independent dispute resolution mechanism

### The Ongoing Legal Challenge

Max Schrems and NOYB filed a complaint against the DPF shortly after it came into force, arguing that US surveillance laws — particularly FISA Section 702 and Executive Order 12333 — still do not provide essentially equivalent protection to EU law. A legal challenge is pending before the Court of Justice of the European Union (CJEU).

As of March 2026, the DPF remains valid. But given the history — Privacy Shield was struck down 4 years after it was introduced — businesses that rely solely on DPF certification without maintaining SCCs as a fallback are taking a risk. Many privacy professionals recommend implementing both: DPF certification as the primary mechanism and SCCs as a backup.

---

## Binding Corporate Rules (BCRs): For Large Multinationals

Binding Corporate Rules are an alternative mechanism for GDPR international data transfers within multinational corporate groups. BCRs are approved by a lead EU supervisory authority (data protection authority) and create binding, enforceable obligations on all entities within the corporate group worldwide.

BCRs are not a realistic option for most small and medium businesses. The approval process takes 18–24 months, requires extensive documentation, and demands ongoing governance. BCRs are typically used by large multinationals that regularly transfer data across many jurisdictions within their corporate group — think global companies with subsidiaries in the US, India, and elsewhere.

If you are a large organisation with significant intra-group data flows, BCRs can provide a streamlined mechanism that avoids executing individual SCCs with dozens of group entities.

---

## Derogations Under Article 49: Transfer Without Safeguards

Article 49 of GDPR provides a set of "derogations" — specific circumstances where personal data can be transferred to a third country even without an adequacy decision, SCCs, or BCRs.

These derogations include:

- **Explicit consent:** The data subject has explicitly consented to the transfer, after being informed of the risks
- **Contract performance:** The transfer is necessary to perform a contract with the data subject (e.g., booking a hotel in the US)
- **Public interest:** The transfer is necessary for important reasons of public interest
- **Legal claims:** The transfer is necessary to establish, exercise, or defend legal claims
- **Vital interests:** The transfer is necessary to protect the vital interests of the data subject

Article 49 derogations are intended for occasional, non-repetitive transfers in specific circumstances. They are not a lawful basis for systematic, large-scale routine transfers. Regulators have been clear that organisations cannot rely on Article 49 derogations as a substitute for proper transfer mechanisms.

---

## Transfer Impact Assessments (TIAs): When Required and What They Involve

Following Schrems II, the European Data Protection Board (EDPB) issued guidance making clear that SCCs alone are not always sufficient to authorise GDPR international data transfers. Exporters must assess whether the law and practice of the destination country undermine the protections provided by the SCCs.

This assessment is called a Transfer Impact Assessment (TIA).

### When a TIA Is Required

A TIA is required whenever you rely on SCCs (or BCRs) as your transfer mechanism — particularly for transfers to countries with broad government surveillance laws, such as the United States, India, or China.

### What a TIA Involves

1. **Map the transfer** — identify what data you are transferring, to where, and under what mechanism
2. **Assess the destination country's legal framework** — review applicable surveillance laws, access rights of public authorities, and judicial oversight
3. **Assess the practical risk** — consider how likely it is that public authorities would actually access the specific data transferred
4. **Identify supplementary measures** if needed — encryption in transit and at rest, pseudonymisation, contractual provisions
5. **Document your conclusions** — if you conclude transfers can proceed, document your reasoning; if you conclude transfers cannot proceed, you must suspend them

Many US SaaS providers publish "transfer impact assessments" or "legal guides" for EU customers that document the legal analysis for their specific services. While these are helpful starting points, you retain responsibility for your own assessment.

---

## The Schrems II Ruling: What Changed and Why It Still Matters

On 16 July 2020, the Court of Justice of the European Union (CJEU) issued its landmark ruling in Data Protection Commissioner v Facebook Ireland Limited and Maximillian Schrems (Case C-311/18), commonly known as Schrems II.

The ruling had two major consequences:

1. **Privacy Shield was invalidated.** The EU-US Privacy Shield framework, which had allowed transfers to certified US companies since 2016, was struck down on the grounds that US surveillance law (particularly FISA 702) did not offer essentially equivalent protection to EU law.

2. **SCCs remain valid, but with conditions.** The Court upheld SCCs as a valid transfer mechanism — but ruled that exporters must assess whether the SCCs can actually be complied with given the laws of the destination country. If SCCs cannot be adhered to, the transfer must be suspended.

The Schrems II ruling effectively created the requirement for Transfer Impact Assessments and the need to consider supplementary measures. It also led to a wave of decisions from EU data protection authorities finding that transfers of EU personal data to US service providers — including Google Analytics and Mailchimp — violated GDPR.

Even with the EU-US DPF in place, Schrems II matters because: (a) not all US companies are DPF-certified, (b) the DPF itself faces a new legal challenge, and (c) the CJEU's reasoning about US surveillance law has not been fundamentally changed by the Executive Order underlying the DPF.

---

## Sub-Processor International Transfers: Your Vendor's Vendors

One of the least-understood aspects of GDPR international data transfers is the sub-processor chain. When you use a US SaaS platform, that platform may itself rely on other third-country vendors — their own sub-processors.

Under GDPR, you are responsible for ensuring that your processors only engage sub-processors under binding data protection obligations (Article 28(4)). If your processor's sub-processors are located in third countries, those sub-processor transfers must also comply with Chapter V.

In practice:
- Review your vendor's DPA and sub-processor list
- Check which sub-processors are located in third countries
- Verify that the vendor has appropriate safeguards in place for onward transfers (typically through its own SCCs or DPF certification)
- Ensure your DPA requires the vendor to notify you of sub-processor changes

Large vendors like AWS, Google Cloud, and Salesforce publish detailed sub-processor lists and maintain SCCs for onward transfers. Smaller vendors often do not — and that creates risk.

---

## Practical Guide: What to Do When You Use US SaaS Tools

If you use any US cloud services — and virtually every business does — here is how to approach GDPR international data transfers in practice.

**AWS, Google Cloud, Microsoft Azure:** All three provide comprehensive GDPR documentation, signed DPAs with SCCs, and TIA resources. Transfers to these providers can generally be structured compliantly, though you should execute their DPA and review their TIA documentation.

**Salesforce, HubSpot, Marketo:** These CRM and marketing platforms have signed DPAs available with SCCs. Salesforce is DPF-certified. Review their sub-processor lists for any additional third-country processors.

**Mailchimp (Intuit):** Has a DPA with SCCs available. DPF-certified. Review the data flows involved in automated emails and integrations.

**Slack, Intercom, Zendesk:** All provide DPAs with SCCs. DPF certification varies — check the DoC certification list. Review whether your configuration stores EU personal data in US regions.

**Stripe:** Operates a DPA with SCCs. EU data is primarily processed in EU regions, but review sub-processors for any US-based entities in the payment processing chain.

For each tool: (1) execute the DPA, (2) confirm the transfer mechanism (DPF certification and/or SCCs), (3) review the sub-processor list, (4) document your TIA or review their published TIA.

---

## Practical Checklist: 7 Steps for Compliant GDPR International Data Transfers

1. **Map your international data flows** — identify every instance where EU personal data leaves the EEA, including cloud providers, SaaS tools, remote workers, and sub-processors.

2. **Check adequacy** — for each destination country, check whether an adequacy decision is in place. If so, no further steps are needed for that transfer.

3. **Identify your transfer mechanism** — for non-adequate countries, determine the appropriate safeguard: SCCs, DPF certification (for US transfers), or BCRs.

4. **Execute DPAs and SCCs** — for each processor in a third country, sign their DPA and confirm it incorporates 2021-version SCCs with the correct module.

5. **Conduct Transfer Impact Assessments** — for SCC-based transfers, conduct (or review the vendor's) TIA for the destination country. Document your conclusions.

6. **Review sub-processor chains** — verify that your processors have appropriate mechanisms in place for their own sub-processor transfers to third countries.

7. **Document and review regularly** — record your transfer mechanisms in your Records of Processing Activities (RoPA) and review annually, especially when adequacy decisions or DPF status changes.

---

## Scan Your Site to Identify All International Data Flows

One of the hardest parts of managing GDPR international data transfers is knowing what you actually have. Websites routinely load dozens of third-party scripts — analytics, advertising, customer support, A/B testing — each of which may transfer EU visitor data to servers outside the EEA.

[Custodia](https://app.custodia-privacy.com) scans your website to identify all third-party trackers, scripts, and services that collect EU personal data — including those that involve international data transfers. You get a clear picture of your data flows so you can implement the right safeguards for each one.

**Start with a free scan — no signup required. Results in 60 seconds.**

[Scan Your Website Free →](https://app.custodia-privacy.com)

---

*Last updated: March 27, 2026. This post provides general information about GDPR international data transfers. It does not constitute legal advice. Transfer compliance depends on the specific facts of your situation — consult a qualified privacy professional for advice tailored to your organisation.*
