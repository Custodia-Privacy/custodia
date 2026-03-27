# GDPR and Marketing Emails: The Complete Guide to Compliant Campaigns

**Your email list might be your biggest GDPR liability.** Most businesses treat their email programme as a pure marketing asset — they rarely consider whether the data behind it was lawfully collected, whether consent was validly obtained, or whether the suppression infrastructure actually works. This guide covers every dimension of GDPR marketing emails compliance, from lawful basis selection through to your email service provider relationship.

---

## The Legal Basis Question: Consent vs Legitimate Interest

GDPR requires a lawful basis for every processing activity. For GDPR marketing emails sent to individuals, the two candidates are **consent** and **legitimate interest**. Getting this wrong is one of the most common GDPR violations in practice.

### Consent

Consent under GDPR must be:

- **Freely given** — not bundled with a condition of service
- **Specific** — tied to a particular purpose, not "marketing generally"
- **Informed** — the person must know what they're consenting to
- **Unambiguous** — active, positive action (a pre-ticked box is never valid)
- **Withdrawable** — as easy to withdraw as to give

If any of these conditions aren't met, the consent is void and you don't have a lawful basis for sending GDPR marketing emails to that person.

### Legitimate Interest

Legitimate interest (Article 6(1)(f)) requires a three-part test:

1. **Purpose test**: Is there a legitimate interest? (Commercial marketing can qualify)
2. **Necessity test**: Is processing necessary to achieve it?
3. **Balancing test**: Does the individual's privacy interest override yours?

For unsolicited cold B2C marketing emails, this test usually fails at the balancing stage. The ICO (UK) and Article 29 Working Party guidance is explicit that direct marketing to individuals generally requires consent, not legitimate interest, particularly under PECR (the ePrivacy Directive in the UK).

For B2B marketing, the picture is more nuanced — see below.

---

## When Legitimate Interest Works for B2B Marketing

In a B2B context, there are stronger arguments that legitimate interest can support marketing email outreach, particularly if:

- The contact is reached at a corporate email address (not a personal one like gmail.com)
- The subject matter is genuinely relevant to their professional role
- The sender's interest in reaching them is proportionate
- The email includes an easy, functional unsubscribe

This is not a blank cheque. You still need to document a Legitimate Interests Assessment (LIA) and ensure the balancing test genuinely passes. "We want to sell them something" is not sufficient. The processing must be necessary and the individual's interests must not override yours.

---

## When Legitimate Interest Does NOT Work for B2C Marketing

For B2C GDPR marketing emails — emails sent to individual consumers — legitimate interest is not a viable basis in most EU and UK jurisdictions. Regulators have been consistent on this.

The ICO's guidance states clearly: "If you are sending electronic marketing, you need to comply with PECR as well as UK GDPR. PECR requires consent for electronic marketing to individuals."

Attempting to rely on legitimate interest for B2C marketing emails is the most common form of "consent laundering" regulators see. If you're sending consumer marketing emails under a legitimate interest basis, you should review this immediately.

---

## What Valid Consent for Email Marketing Looks Like

Valid consent for GDPR marketing emails requires a clear, affirmative action at the point of collection. The ICO's consent checklist for email marketing:

1. **Unticked checkbox** at the point of sign-up, clearly labelled with the marketing purpose
2. **Granular** — separate consent for different types of communication (e.g. newsletters vs product offers)
3. **Named sender** — the specific organisation sending emails must be identified
4. **No pre-bundled consent** — signing up for a free trial does not imply consent to marketing emails
5. **Retained consent records** — timestamp, what was consented to, and the text shown at point of collection

### Double Opt-In as Best Practice

Double opt-in — sending a confirmation email before adding someone to your list — is not legally required under GDPR but is considered best practice. It:

- Verifies the email address is valid and owned by the submitter
- Creates a clear audit trail proving the person actively confirmed their subscription
- Reduces spam complaints and bounce rates
- Substantially reduces the risk of GDPR challenges about whether consent was really given

If your ESP supports it (Mailchimp, Klaviyo, ActiveCampaign all do), enable double opt-in for all new subscriber journeys.

---

## The B2B Soft Opt-In Rule Under PECR (UK)

The UK's Privacy and Electronic Communications Regulations (PECR) includes a specific exception for existing customers: the **soft opt-in**.

Under the soft opt-in rule, you can send marketing emails to business contacts without separate consent if:

- You obtained their contact details in the course of a sale (or negotiations for a sale)
- You are marketing your **own** similar products or services
- You gave them a clear opportunity to opt out when you collected their details
- You include an unsubscribe mechanism in every subsequent email

This only applies to existing customers or prospects who came through a commercial transaction. It does not apply to purchased lists, scraped data, or contacts who haven't engaged in a commercial relationship with you.

---

## Re-Permission Campaigns: When to Run One and How

If you inherited an email list through a business acquisition, built your list before GDPR came into force in May 2018, or have reason to doubt the validity of your existing consents — you need to consider a re-permission campaign.

A re-permission campaign emails your existing list asking subscribers to actively confirm they want to continue receiving emails. Those who don't respond should be suppressed, not re-emailed.

**When to run one:**
- You can't demonstrate a compliant consent record for existing subscribers
- You inherited a list from another business
- Your original consent was for a different purpose than what you're now sending
- You've been inactive for 12+ months and subscribers may not remember opting in

**How to do it right:**
1. Send a single clear re-permission email with a prominent "Stay subscribed" CTA
2. Explain what you'll be sending and how often
3. Set a deadline — anyone who doesn't confirm within 30 days is moved to your suppression list
4. Do not send reminder emails to non-responders (this is itself marketing)
5. Document the process and the outcome

---

## Unsubscribe Requirements

GDPR and PECR both require that every commercial email includes an easy mechanism to opt out of future emails. The standards are:

- **One-click unsubscribe**: The person should be able to unsubscribe without needing to log in, provide a password, or navigate multiple screens
- **Honoured within 10 business days**: PECR requires you to action unsubscribe requests promptly — ICO guidance points to 10 business days as the maximum acceptable timeframe
- **No re-subscription dark patterns**: You cannot add someone back to your list unless they actively re-subscribe
- **No "required" fields on unsubscribe pages**: Asking someone to give a reason for unsubscribing is fine; requiring them to do so is not

Gmail and Yahoo's 2024 sender requirements added one-click unsubscribe (RFC 8058) as a deliverability requirement for bulk senders — so this is now both a legal and operational necessity.

---

## Email Content Requirements

Every GDPR marketing email must contain:

- **Sender identity**: The name and registered address of the organisation sending the email. "From: Acme Marketing Team" is insufficient if there's no legal entity identified
- **Physical address**: A postal address for the sending organisation (this is also a CAN-SPAM requirement for US marketers)
- **Unsubscribe link**: Clear, functional, and in every email — including sequences, automation, and one-off campaigns
- **Accurate subject lines**: Misleading subject lines violate PECR and can constitute unfair commercial practice under consumer protection law

Subject lines designed to trick recipients into opening emails (e.g. fake "Re:" prefixes, false urgency) are a separate violation risk beyond GDPR.

---

## Suppression Lists: Maintaining and Honouring Opt-Outs

A suppression list is a record of email addresses that have opted out of your marketing. The requirement is not just to stop emailing them — it's to **retain their email address in a suppression list** so that if the address is later re-added to your database (through a new sign-up, a data import, or a third-party list merge), they are not emailed again.

Most ESPs maintain suppression lists automatically for unsubscribe requests processed through their platform. But you need to ensure:

- **Suppression is applied across all sending streams** — if you use multiple ESPs or have transactional and marketing sends separated, suppression needs to be synchronised
- **Manual unsubscribe requests are captured** — if someone replies "unsubscribe" to an email, that needs to be actioned manually and added to your suppression list
- **Suppression lists survive platform migrations** — if you move from Mailchimp to Klaviyo, export and import your suppression list as part of the migration

Failure to honour opt-outs is one of the most straightforward GDPR violations to prove, and regulators take it seriously.

---

## Buying Email Lists: Why It's a GDPR Disaster

Purchasing a third-party email list and sending GDPR marketing emails to those contacts is almost always unlawful. Here's why:

1. **No valid consent**: The individuals on that list did not consent to receive emails from you specifically. They may have consented to emails from the list vendor, or to "partner offers," but that consent cannot be transferred to you
2. **No legitimate interest**: Cold emailing a purchased B2C list fails the legitimate interest balancing test; cold emailing a purchased B2B list is legally precarious at best
3. **Inaccurate data**: Purchased lists are rarely kept current — contacting people at outdated addresses or after they've opted out creates additional violations
4. **Spam complaints**: High complaint rates from bought-list campaigns damage your sender reputation and can get your domain blacklisted

The ICO has investigated and fined businesses for using purchased lists. The fines are not hypothetical.

If a vendor is selling you an email list with "GDPR-compliant data," scrutinise the claim carefully. What they typically mean is that the original data collector obtained consent — but that consent is specific to the original data collector, not to you.

---

## Segmentation and Profiling: Data Minimisation in Targeting

GDPR's data minimisation principle (Article 5(1)(c)) requires you to use only the personal data that is adequate, relevant, and limited to what is necessary for the processing purpose.

In an email marketing context, this means:

- **Don't collect demographic fields you don't use in segmentation**: If you ask for someone's job title at sign-up but never use it for targeting, stop collecting it
- **Profiling requires transparency**: If you're using behavioural data (open rates, link clicks, purchase history) to segment audiences, this should be disclosed in your privacy policy
- **Automated decision-making rules apply if segmentation has legal effects**: For most marketing segmentation this isn't triggered, but if you're using AI-driven models to exclude certain groups from offers, take legal advice

Keep your consent records linked to the specific segments subscribers have consented to. Someone who signed up for your newsletter hasn't necessarily consented to being added to your re-marketing automation sequence.

---

## Transactional vs Marketing Emails: The Distinction and Why It Matters

Not all emails require marketing consent. **Transactional emails** — those that are necessary to fulfil a contract or provide a service — can generally be sent without a marketing consent basis:

| Transactional (no marketing consent needed) | Marketing (consent or legitimate interest required) |
|---|---|
| Order confirmation | Promotional newsletter |
| Shipping notification | Product recommendations |
| Account creation confirmation | Discount/offer emails |
| Password reset | Upsell campaigns |
| Invoice/receipt | "We miss you" win-back emails |
| DSAR acknowledgment | Case study or content emails |

The line becomes grey when transactional emails contain marketing content. An order confirmation that includes a "You might also like..." section is partially a marketing email. If your transactional emails include marketing elements, they should include an unsubscribe option for the marketing component.

Some ESPs have separate infrastructure for transactional and marketing sends — this is best practice because it prevents suppression lists from blocking transactional emails.

---

## The Email Service Provider Relationship: DPA with Mailchimp/Klaviyo/etc.

Your email service provider processes personal data on your behalf. Under GDPR Article 28, this requires a **Data Processing Agreement (DPA)**.

Most major ESPs have DPAs available:

- **Mailchimp**: Available in Account Settings under Legal
- **Klaviyo**: Available in their legal documents section
- **ActiveCampaign**: Available on request or in account settings
- **Brevo (formerly Sendinblue)**: Available in their GDPR documentation

Simply using the platform without a DPA in place is a GDPR violation, even if you never have a data breach. You also need to review what data your ESP collects automatically (tracking pixels, open tracking, click tracking) and disclose this in your privacy policy.

Post-Brexit and with the EU-US Data Privacy Framework in place, US-based ESPs have a cleaner data transfer story than they did in 2021-2022 — but the DPA requirement remains.

---

## Practical Checklist: 8 Things to Audit in Your Email Programme

Use this checklist to identify GDPR marketing emails compliance gaps in your current programme:

1. **[ ] Consent records exist for all subscribers** — Can you produce a timestamp, IP address, and the consent text shown for every subscriber? If not, identify the gap.

2. **[ ] Sign-up forms use unticked checkboxes** — Audit every sign-up touchpoint. Pre-ticked boxes, implied consent from form submission, and bundled consent with terms acceptance all fail GDPR.

3. **[ ] Double opt-in is enabled** — Check your ESP configuration. If double opt-in is not enabled, enable it going forward and document the decision if you're keeping it off.

4. **[ ] Unsubscribe is one-click and functional** — Test the unsubscribe link in your last three campaign emails. Does it work without requiring login? Does it suppress immediately?

5. **[ ] Suppression list is maintained and synchronised** — Check whether unsubscribes from one sending stream apply across all others.

6. **[ ] Your ESP DPA is signed** — Log into your ESP account and confirm the DPA is in place. If it isn't, sign it today.

7. **[ ] Privacy policy discloses email tracking** — Does your privacy policy mention that you use email tracking pixels, open rate tracking, or behavioural email automation? It should.

8. **[ ] Purchased or inherited list contacts have been validated** — If any portion of your list came from a third party or a business acquisition, document the consent basis or suppress those contacts.

---

## Scan Your Consent Collection Before Your Next Campaign

GDPR marketing emails compliance starts at the point where people join your list — your website sign-up forms, landing pages, and checkout flows. If those are collecting email addresses without proper consent language, no amount of unsubscribe infrastructure will fix the underlying problem.

[Custodia](https://app.custodia-privacy.com) scans your website and sign-up flows to identify consent implementation issues — including missing consent checkboxes, pre-ticked boxes, and forms that don't link to a privacy policy. Free scan, no signup required, results in 60 seconds.

Fix the foundation before your next campaign.

---

*Last updated: March 27, 2026. This post provides general information about GDPR marketing emails compliance. It does not constitute legal advice. Privacy law is complex and jurisdiction-specific — consult a qualified privacy professional for advice tailored to your situation.*
