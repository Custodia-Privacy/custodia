# Email Marketing and GDPR: What Consent Actually Means (and What Doesn't Count)

*Buying an email list violates GDPR. Pre-checking a consent box violates GDPR. Sending marketing emails to people who signed up for something else violates GDPR. Here's what valid email consent actually looks like.*

---

## Why Email Marketing Is a GDPR Hotspot

Email marketing sits at the intersection of two things regulators care deeply about: direct contact with individuals and consent. Under GDPR, every piece of personal data processing requires a lawful basis. For direct marketing to new contacts — people who don't already have a purchasing relationship with you — that basis is almost always consent.

And consent has a specific legal meaning under GDPR. It must be:

- **Freely given** — the person had a genuine choice and wasn't penalized for refusing
- **Specific** — they consented to this processing for this purpose, not a vague bundle of "marketing activities"
- **Informed** — they understood who was collecting their data and what it would be used for
- **Unambiguous** — they took a clear affirmative action; silence and inaction don't count

The Information Commissioner's Office (ICO) in the UK — one of the most active GDPR enforcement bodies — has consistently listed email marketing as a top enforcement priority. In 2024 alone, the ICO issued fines for marketing to bought lists, pre-ticked consent boxes, and consent obtained through misleading language.

The uncomfortable truth: most email compliance failures aren't from bad actors deliberately circumventing the rules. They're from businesses that haven't updated their opt-in flows since GDPR came into force in 2018, or that trusted their email platform's "GDPR mode" to do the heavy lifting.

---

## What Doesn't Count as Valid Consent

This is where most businesses get it wrong. Run through this list against your current signup flows.

**Pre-checked opt-in boxes.** A checkbox that's already ticked when the form loads is not valid consent. The person hasn't taken any action — they've just not unchecked a box you checked for them. Consent must involve an affirmative act. Every opt-in checkbox must start unchecked.

**Consent buried in terms of service.** "By creating an account you agree to receive marketing emails" is not GDPR-compliant consent, regardless of where it appears in your terms. Consent to marketing cannot be bundled with consent to your terms of service — it must be a separate, specific, and voluntary agreement.

**Buying or renting email lists.** When you purchase a list of email addresses, those individuals have not consented to receive marketing from *you*. They may have consented to receive marketing from the company they originally provided their details to — but that consent cannot be transferred. Using a bought list for email marketing is one of the clearest GDPR violations possible.

**Signing people up when they purchased.** Transactional emails — order confirmations, shipping updates, account notifications — are not marketing emails and don't require the same consent. But adding a customer to your marketing newsletter because they purchased is a separate action that requires separate consent. The purchase is not consent to receive your newsletter.

**Silence or inactivity.** "If you don't unsubscribe within 30 days we'll assume you consent to our newsletter" is not valid consent. GDPR is explicit: silence, inactivity, and pre-ticked boxes do not constitute consent.

**Consent collected without naming the sender.** If someone signed up to a partner's list and "agreed to receive offers from selected third parties," that's not a valid basis for *you* to email them. Consent must specify who will be doing the marketing. A blanket agreement to hear from unnamed third parties doesn't meet GDPR's specificity requirement.

---

## What Valid Consent Looks Like

Valid consent is simpler than most businesses expect — the challenge is implementation, not concept.

**The form element:** An unchecked checkbox. Not pre-ticked. Not hidden behind expanded sections. Present at the point of signup, clearly labeled.

**The consent language:** Specific and accurate. Not "receive updates from us" — that's too vague. Something like: *"Yes, I'd like to receive Custodia's weekly privacy compliance newsletter. I can unsubscribe at any time."* Name the sender, describe what you'll send, and tell them how to stop.

**The consent record:** This is where most businesses have a gap. When someone opts in, you need to capture:
- The timestamp of consent
- The URL or form they submitted
- The exact wording of the consent notice they saw
- Whether the checkbox was checked by the user (not pre-ticked)

You'll need this if a regulator or the individual themselves ever challenges whether valid consent was obtained. "We used a Mailchimp form" is not an adequate record. The specific consent notice, at that specific time, on that specific page, is what you need.

A good consent record looks like: *User opted in at 14:23 UTC on 12 March 2026 via /resources/gdpr-checklist form. Consent notice shown: "Yes, I'd like to receive Custodia's weekly privacy compliance newsletter." Checkbox was unchecked by default.*

---

## Legitimate Interest for Existing Customers

There is one pathway to email marketing without fresh consent: the existing customer exemption, sometimes called the "soft opt-in."

Under GDPR (and PECR in the UK), you can market to existing customers under **legitimate interest** if all of the following conditions are met:

1. They are an existing customer — they have previously purchased from you or taken a substantive step toward purchasing
2. You are marketing similar products or services to what they bought
3. You gave them a clear, easy opportunity to opt out at the point of purchase and in every subsequent marketing email

The "similar products" condition is where businesses go wrong. If someone bought your SaaS product, you can market new features, an upgraded tier, or a complementary product in the same category. You cannot start marketing unrelated services simply because they're a customer.

This exemption also doesn't override the requirement for an easy unsubscribe. Even under legitimate interest, every marketing email must contain a functioning unsubscribe mechanism.

---

## What Your Email Platform's Compliance Settings Actually Do

Mailchimp, Klaviyo, ConvertKit, and most other email platforms now offer "GDPR-friendly" form options. Enabling these settings is necessary but not sufficient. Here's what they actually do and don't do.

**What the settings do:** Add a consent checkbox to the form. Make the checkbox unchecked by default. Log that the checkbox was checked when the form was submitted. Some platforms also store the consent notice text.

**What the settings don't do:** Write your consent language for you. Verify that your consent language is specific enough. Ensure your consent records are complete. Make your existing list (imported contacts, bought contacts, pre-GDPR signups) compliant. Handle unsubscribes within any particular timeframe.

In other words: enabling your platform's GDPR settings makes the form *capable* of collecting valid consent. Whether it actually does depends on the language you use, your form configuration, and what you're doing with the data afterward.

Critically, enabling GDPR settings in your email platform does nothing to fix a list that was collected without valid consent. Those contacts need to be either removed or re-permissioned.

---

## Re-Permission Campaigns — When and How

If you have a list with questionable consent history — imported contacts, pre-GDPR signups, unclear opt-in source, or a bought list you've been using — a re-permission campaign is the path to cleaning it up.

**What a re-permission campaign is:** An email sent to your list asking contacts to actively confirm they want to hear from you. Anyone who doesn't respond affirmatively is removed.

**How to run one:**
1. Send a clear email explaining that you're updating your list and they need to confirm their subscription to stay on it
2. Include a prominent "Yes, keep me subscribed" button that requires an active click
3. Set a deadline (two to three weeks is typical)
4. Remove everyone who hasn't confirmed by the deadline

**What to expect:** Significant list shrinkage. A well-run re-permission campaign typically retains 20–40% of contacts who didn't originally provide clear consent. This is painful, but a smaller engaged list is more valuable — and legally defensible — than a large list of contacts who may complain.

Do not run a re-permission campaign using a "click to unsubscribe if you don't want emails" mechanism. That's not re-permission — it's just another message. You need an affirmative opt-in.

---

## The Unsubscribe Requirements

Every marketing email you send must include a clearly visible, functioning unsubscribe mechanism. This isn't optional and there are no size thresholds or volume exemptions.

"Clearly visible" means it can be read without a magnifying glass and isn't disguised as something else. A light gray "unsubscribe" link in 8pt text at the bottom of a long email doesn't meet the spirit of the requirement, even if it technically functions.

"One-click" unsubscribe is the practical standard. Requiring someone to log in, confirm their identity, fill out a form explaining why they're leaving, or wait for a confirmation email before being removed are all compliance risks and common complaint triggers.

**Processing time:** GDPR doesn't specify a deadline for processing unsubscribes, but the ICO has treated slow processing as a PECR violation when it results in further marketing emails being sent. The practical standard is processing within 10 business days. Most email platforms handle this automatically if configured correctly — but if you're doing any manual list management or exporting to other systems, make sure unsubscribes propagate everywhere.

Continuing to email someone after they've unsubscribed is one of the most common triggers for individual complaints to the ICO.

---

## Auditing Your Current Email Setup

Before you can fix anything, you need to know what you're working with. Start by answering these questions for each email marketing tool you use:

- How was this list collected? What did the opt-in form say?
- Is there a record of when each contact opted in?
- Was the checkbox unchecked by default?
- Are there any imported contacts or bought lists on this account?
- When did signups happen — before or after GDPR came into force?

If you can't answer these questions confidently for your current list, you have a consent problem.

The next step is understanding which email tools are loading on your website — because many businesses don't have a complete picture of what's collecting data. [Scan your site at app.custodia-privacy.com/scan](https://app.custodia-privacy.com/scan) to see every email marketing tool, tracking pixel, and data collection mechanism running on your website. From there, you can audit the consent flow for each one and identify where the gaps are.

Custodia's consent management ensures that email opt-ins are captured with the specificity GDPR requires, consent records are stored and audit-ready, and your setup can withstand a regulator's questions — not just your own.

*Last updated: March 2026*
