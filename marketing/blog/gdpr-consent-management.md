# GDPR Consent Management: What Valid Consent Actually Looks Like

Most websites have an "I accept" button. Most of those buttons don't constitute valid consent under GDPR.

That's not a technicality. It's the central finding in enforcement actions across the EU — from the Irish DPC's rulings against Meta, to France's CNIL fines against Google and Facebook, to the Belgian DPA's landmark decision against the IAB's consent framework. In each case, the conclusion was the same: the mechanisms organisations used to obtain consent didn't meet the standard GDPR requires.

GDPR consent management isn't just about having a banner. It's about ensuring that the consent you obtain actually qualifies as consent under law. This guide covers what Article 7 requires, where most implementations fail, and what a compliant consent flow actually looks like.

---

## The Four Requirements for Valid Consent

GDPR Article 7, read alongside Recital 32 and the EDPB's Guidelines on Consent, establishes four cumulative requirements. Consent must be:

1. **Freely given** — the person has a genuine choice and can refuse without penalty
2. **Specific** — the consent covers a defined purpose, not a bundle of unrelated activities
3. **Informed** — the person knows what they're agreeing to before they agree
4. **Unambiguous** — there's a clear, affirmative act — no pre-ticking, no implied agreement

All four must be met. Failing any one of them means the consent is invalid and you don't have a lawful basis to process the data. Every effective GDPR consent management system must satisfy all four requirements.

---

## Freely Given: What It Actually Means

"Freely given" means the person has a genuine choice. They can say no without suffering a detriment. Three common practices violate this requirement.

### Cookie Walls

A cookie wall conditions access to content on accepting all cookies. The user can't read your article, use your service, or access your app unless they click "Accept All." The EDPB has been clear: this is not freely given consent. There is no genuine alternative. The French CNIL and other supervisory authorities have enforced this repeatedly.

An "equivalent alternative" — where you offer the same content or service without consent-based cookies, potentially at a price — is a grey area that supervisory authorities are still working through. But straightforward cookie walls, where the only option is accept or leave, don't meet the standard.

### Bundled Consent

If you bundle consent for cookies with consent to receive marketing emails, consent to share data with third parties, and consent to your general terms of use — all in one click — none of that consent is freely given. The user can't accept the terms while refusing the marketing. They have to take the bundle or nothing.

Consent for each distinct purpose must be separable. In practice: separate checkboxes, separate consent flows, separate records.

### Power Imbalance in Employment Contexts

In an employment context, consent is rarely freely given. If your employer asks you to consent to monitoring of your work computer, your consent is not genuinely voluntary when your job depends on compliance. The EDPB has flagged employee monitoring as an area where consent is almost never the right legal basis — legitimate interest or legal obligation is usually more appropriate.

---

## Specific: One Consent, One Purpose

GDPR Recital 32 is explicit: "Consent should be given... for all purposes of the processing carried out for the same purpose."

That means you can't bundle analytics tracking, remarketing pixels, live chat data collection, and A/B testing under one consent. Each purpose requires its own consent — or at least, purposes must be clearly distinguished.

In practice, this is where most GDPR consent management implementations fail. A single "I accept cookies" button is treating everything you do with visitor data as one thing. It isn't. Google Analytics and Facebook Pixel are different purposes. Performance cookies and preference cookies are different categories. A compliant implementation separates them.

The IAB's Transparency and Consent Framework (TCF) was designed to address this through its "purposes" taxonomy. But even the TCF has faced enforcement action — Belgium's APD found that the framework, as implemented, didn't meet the specificity requirement because the sheer number of purposes presented overwhelmed meaningful choice.

Practical implication: group purposes into meaningful categories, explain each one, and get separate consent for each category that requires it.

---

## Informed: What Must Be Disclosed Before the Click

Article 7(2) and Recital 42 establish that for consent to be informed, the controller must provide certain information before the person clicks. At minimum:

- **The identity of the controller** — who is asking for consent
- **The purpose of each processing operation** — what will you do with the data
- **The types of data collected** — what information is involved
- **The existence of the right to withdraw** — and that withdrawal doesn't affect the lawfulness of prior processing
- **Information about third parties** — if data will be shared with or processed by other organisations
- **Cross-border transfers** — if data is leaving the EEA, under what safeguards

The information must be presented clearly — not buried in a privacy policy linked via small print at the bottom of a consent banner. The EDPB's Guidelines on Consent (05/2020) specify that information must be provided "prominently" and in a way that is distinguishable from other matters.

This doesn't mean your banner needs to be three pages long. It means the essential information must be surfaced before consent, and additional detail must be easily accessible (a "more information" link to a clear privacy notice is generally sufficient).

---

## Unambiguous: What Doesn't Count as Consent

This is where a lot of websites fail the most obviously. GDPR Article 4(11) defines consent as "a statement or a clear affirmative action." That rules out several common practices.

### Pre-Ticked Boxes

A checkbox that's already checked when the page loads is not consent. The person hasn't done anything. They may not have even noticed the checkbox. The Court of Justice of the EU confirmed this in the Planet49 case (C-673/17) — pre-ticked boxes don't constitute valid consent.

### Implied Consent ("By Continuing to Browse...")

"By continuing to use this site, you accept our cookie policy" is not valid consent. Scrolling, clicking, navigating — none of these constitute a clear affirmative act. The user hasn't done anything that specifically signals agreement to data processing.

### Scrolling as Consent

Similar to implied consent — the EDPB's guidelines explicitly state that scrolling or swiping through a webpage does not constitute unambiguous consent.

### Inaction

Silence is not consent. If you load cookies on page load and then show a banner that the user closes without clicking anything, that's not consent. Cookies should not load until after genuine affirmative consent has been obtained (for non-essential cookies).

---

## The Right to Withdraw: As Easy as Giving Consent

Article 7(3) requires that the data subject can withdraw consent at any time, and that withdrawal must be as easy as giving consent.

If you have an "Accept All" button prominently placed, you need an equally prominent way to withdraw. A small "Cookie Settings" link buried in your footer doesn't meet this standard if consent was obtained via a large, central banner. The EDPB has been clear on this: the mechanics of withdrawal must not create friction that wasn't present when consent was given.

Practical implications:
- A "Withdraw Consent" link that's as visible as the original consent mechanism
- A cookie preference centre that allows granular withdrawal by purpose
- Confirmation that withdrawal doesn't affect the lawfulness of processing that occurred before withdrawal
- Actual cessation of the processing in question when consent is withdrawn

---

## Consent Records: What You Must Log

Article 7(1) says the controller must be able to demonstrate that the data subject has consented. That means records. The EDPB recommends that consent records include:

- **Who consented** — identifier for the individual (session ID, user ID, or similar)
- **When they consented** — timestamp
- **What they consented to** — the specific purposes and version of the consent request shown
- **How they consented** — what action they took (clicked "Accept Analytics", for example)
- **What information they were shown** — the version of the consent notice presented at the time

This is why building your own consent banner with a simple cookie is insufficient for compliance. You need a consent management platform that logs this information or a custom implementation that captures and stores it.

Consent records should be retained for as long as the consent is relied upon, plus any applicable statute of limitations for regulatory action in your jurisdiction.

---

## Consent Refresh: When You Need to Obtain New Consent

Consent obtained under one version of your privacy notice doesn't last forever, and it doesn't automatically transfer when circumstances change. You need to re-obtain consent when:

- **You've added new purposes** — if you start using a new analytics tool or ad platform, existing consent doesn't cover it
- **You've added new data categories** — if you begin collecting data you weren't collecting when the original consent was obtained
- **Your privacy notice has materially changed** — changes that affect what the person consented to require fresh consent
- **Significant time has passed** — there's no fixed period, but the EDPB suggests that consent doesn't remain valid indefinitely; periodic re-consent is good practice for long-running relationships

You don't need to re-obtain consent for minor administrative updates to your privacy notice that don't affect the substance of processing.

---

## Legitimate Interest vs Consent: When Each Applies

Consent is not the only lawful basis under GDPR. Article 6 provides six. For many business activities, consent is actually not the right basis — and using it when another basis applies creates problems (because if you rely on consent, the person can withdraw it).

**When consent is typically the right basis:**
- Non-essential cookies and tracking (analytics, remarketing, A/B testing)
- Marketing emails to individuals who haven't purchased from you
- Profiling for personalisation purposes
- Sharing personal data with third parties for their own marketing

**When legitimate interest may apply instead:**
- Security monitoring and fraud prevention
- Internal analytics for service improvement (with appropriate safeguards)
- Direct marketing to existing customers about similar products (with opt-out)
- B2B communications in some jurisdictions

**When consent is never the right basis:**
- Contract performance (processing necessary to fulfil an order)
- Legal obligations (tax records, employment law requirements)
- Vital interests (emergency medical processing)

The practical guidance: if the person would reasonably expect you to process their data for this purpose, and you have a clear legitimate purpose that isn't overridden by their interests, legitimate interest may be more appropriate than consent. But document your legitimate interests assessment — don't use it as a free pass to process data without scrutiny.

---

## Children's Consent: Age Verification Requirements

Article 8 of GDPR creates additional requirements where services are directed at children. For services directed to individuals under 16 (or a lower age set by member state law — the UK uses 13), consent must be given or authorised by a person with parental responsibility.

This creates two challenges:
1. **Age verification** — you need a mechanism to identify whether a user is under the relevant age threshold
2. **Parental consent** — you need a mechanism to obtain and verify parental consent

The EDPB's Opinion 5/2020 on age-appropriate design acknowledges that technical age verification is difficult. The approach expected of organisations depends on the risk — a service that processes sensitive data and is clearly directed at children requires more robust age verification than a general-purpose service that children might incidentally use.

For most B2B SaaS companies, this isn't the primary concern. For consumer-facing products, particularly in education, gaming, or social contexts, age-appropriate design and parental consent mechanisms are a significant compliance consideration.

---

## Practical Implementation: Compliant vs Dark Pattern Consent Banners

GDPR consent management comes down to what your banner actually looks like and how it behaves. Here's the contrast.

### A Compliant Consent Banner

- **Equal prominence** for "Accept" and "Reject" — not a large green "Accept All" next to a tiny grey "Manage Preferences"
- **Granular options** — categories clearly labelled (Analytics, Marketing, Preferences) with separate toggles
- **Pre-off by default** — all non-essential purposes start unchecked
- **Clear information** — who is asking, for what, with a link to more detail
- **Functional cookies clearly distinguished** — and not subject to consent (they're necessary for the service to work)
- **Withdrawal mechanism** — accessible from any page, not just on first visit

### Dark Patterns (All Violate GDPR)

- **Colour differentiation** — "Accept All" in blue, "Reject All" in grey — nudging toward acceptance
- **Reject buried in menus** — "Accept" is a button, rejection requires navigating to "Manage Settings" and then manually toggling each category
- **Misleading framing** — "Help us improve" as the label for analytics consent, rather than "Allow Google Analytics to track your sessions"
- **Fake toggles** — toggles that appear to be in "off" position but are actually pre-enabled
- **Re-asking after rejection** — showing the consent banner again on the next visit after the user has already rejected

The EDPB's Guidelines 03/2022 on Dark Patterns provide extensive examples. The French CNIL has fined Google and Facebook specifically for making rejection harder than acceptance.

---

## Build It Right — or Audit What You Have

If you're not sure whether your current consent implementation meets these requirements, the answer is to audit it against the criteria above. Check:

- Can a user reject all non-essential cookies as easily as they can accept?
- Are non-essential cookies blocked until consent is obtained?
- Are you logging consent records?
- Does your banner clearly identify the controller and the purposes?
- Is there a working withdrawal mechanism?

Custodia scans your website and analyses your consent implementation against GDPR requirements — checking whether cookies fire before consent, whether your banner presents genuine choice, and whether your privacy policy discloses what it should.

[Run a free consent compliance scan at app.custodia-privacy.com](https://app.custodia-privacy.com/scan) — no signup required, results in 60 seconds. See whether your GDPR consent management actually passes the test.

---

*Last updated: March 27, 2026. This post reflects GDPR requirements as currently enforced. It is not legal advice — consult a qualified privacy professional for advice specific to your situation.*
