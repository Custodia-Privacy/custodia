# Legitimate Interest Under GDPR: When You Can Use It and When You Can't

*Legitimate interest is the most flexible lawful basis under GDPR — and the most misused. Here's how to use it correctly, what a legitimate interests assessment looks like, and where it fails.*

---

## The Six Lawful Bases Under GDPR

GDPR requires every piece of personal data processing to have a lawful basis. There are six:

1. **Consent** — The individual has given clear, affirmative agreement to the processing.
2. **Contract** — Processing is necessary to perform a contract with the individual, or to take steps before entering into one.
3. **Legal obligation** — Processing is required to comply with a legal obligation.
4. **Vital interests** — Processing is necessary to protect someone's life.
5. **Public task** — Processing is necessary for a task carried out in the public interest or by official authority.
6. **Legitimate interests** — Processing is necessary for your legitimate interests (or a third party's), unless overridden by the individual's rights and freedoms.

Most small businesses operate primarily under consent and contract. Legitimate interests — Article 6(1)(f) — is the one that causes the most confusion because it's flexible, subjective, and frequently invoked without the analysis it actually requires.

It's not a catch-all. It's a three-part test.

---

## The Three-Part Legitimate Interests Test

Before you rely on legitimate interest for any processing activity, you must work through all three parts. Skip any of them and your legal basis is invalid.

### Part 1: Purpose — Is There a Legitimate Interest?

The first question is whether you actually have a legitimate interest to pursue. This doesn't have to be extraordinary. Commercial interests count: preventing fraud, maintaining network security, direct marketing to existing customers, enabling normal business operations.

The key word is "legitimate." The interest must be real, specific, and not prohibited by law. A vague assertion that "improving our services" justifies tracking users across the internet won't hold up. A specific interest in preventing account fraud on a platform where you process financial data will.

### Part 2: Necessity — Is Processing Necessary for That Purpose?

Even with a legitimate interest, you can only rely on Article 6(1)(f) if the processing is actually necessary to achieve it. This is a proportionality check: is there a less privacy-invasive way to get the same result?

If you want to prevent fraud, do you need to build a behavioral profile of every user on your site, or would analyzing only flagged transactions accomplish the same thing? If the answer is the latter, processing the full behavioral data isn't necessary — and the necessity test fails.

### Part 3: Balancing — Does Your Interest Override the Individual's Rights?

This is where many organizations stumble. Even if you have a legitimate interest and the processing is necessary, you must weigh that interest against the rights and interests of the individuals whose data you're processing.

Factors that favor the individual in this balance:
- The data is sensitive (health, financial, behavioral)
- The individual would not reasonably expect this use of their data
- The processing has significant impact on them (profiling, decisions about them)
- They cannot easily object or be aware of the processing

If the balance tips toward the individual, legitimate interest fails and you need a different lawful basis — or you need to reconfigure the processing.

---

## Where Legitimate Interest Works

Used properly, legitimate interest is a reasonable basis for several common processing activities.

**Direct marketing to existing customers.** The GDPR recitals specifically mention marketing to existing customers as an example of legitimate interest (Recital 47). You have an established relationship, the individual would reasonably expect to hear from you, and the impact is low — as long as you provide a clear opt-out.

**Fraud prevention and security monitoring.** Monitoring for fraudulent transactions, detecting account takeovers, and analyzing login patterns for security purposes all have clear legitimate interests. The necessity and balancing tests generally hold up here, especially when the monitoring is proportionate to the risk.

**Network and information security.** Logging access attempts, monitoring for intrusions, and maintaining system integrity are broadly accepted as legitimate interests. Recital 49 of GDPR specifically addresses this.

**Sharing data within a corporate group.** Intra-group data transfers for administrative purposes — HR data shared between group entities, consolidated customer records for service delivery — can rely on legitimate interest, though the balancing test still applies.

**Employee monitoring for legitimate business purposes.** With significant caveats: monitoring must be proportionate, employees must be informed, and the privacy impact must be justified by a real business need. Blanket surveillance rarely passes the balancing test.

---

## Where Legitimate Interest Fails

There are processing activities where legitimate interest has been tested and failed — sometimes expensively.

**Behavioral advertising to new users.** The meta-analysis of EU regulatory decisions is clear: relying on legitimate interest for tracking and profiling users who don't have an existing relationship with you is very high risk. The Irish Data Protection Commission's 2023 ruling against Meta — resulting in a €390 million fine — found that Meta could not rely on legitimate interest (or contract) as a basis for personalized advertising. The reasoning: users would not reasonably expect their data to be used this way, and the privacy impact is significant.

**Third-party data sharing for advertising.** Sharing user data with ad networks, data brokers, or other third parties for advertising purposes almost never passes the balancing test. The individual has no relationship with the third party, the processing is opaque, and the impact on privacy is high.

**Processing special category data.** Health data, biometric data, genetic data, religion, political opinions, sexual orientation — none of this can be processed under legitimate interest alone. Special category data requires both a lawful basis under Article 6 and a separate condition under Article 9. Legitimate interest does not satisfy Article 9.

**Profiling for automated decisions with significant effects.** Article 22 restricts automated decision-making that has significant effects on individuals. Even where legitimate interest might otherwise apply, the additional restrictions on automated profiling limit what you can do without consent.

---

## How to Document a Legitimate Interests Assessment (LIA)

If you rely on legitimate interest, you must document your reasoning. A legitimate interests assessment isn't optional — supervisory authorities can and do ask for them during investigations, and a vague or missing LIA will undermine your defense.

A straightforward LIA covers three things:

**1. Identify the legitimate interest.** Be specific. "Preventing fraudulent account creation by analyzing behavioral signals at signup" is a legitimate interest. "Improving user experience" is not specific enough.

**2. Explain why processing is necessary.** Describe what you're doing with the data and why there isn't a less privacy-invasive alternative. If you can achieve the same goal by processing less data, or no personal data at all, you need to explain why that's not sufficient.

**3. Assess the impact and explain the balance.** Who is affected? What data do you process? What's the realistic impact on individuals? Why does your interest outweigh theirs? Consider: Would individuals reasonably expect this processing? Can they easily opt out? Is the impact significant or minor?

Keep the LIA on file and revisit it when your processing changes. An LIA written two years ago for a processing activity that has since expanded in scope is not adequate documentation.

---

## The Right to Object

When you rely on legitimate interest as your lawful basis, individuals gain an important right under Article 21: the right to object to the processing.

This right is near-absolute. When someone objects, you must stop processing their data unless you can demonstrate compelling legitimate grounds that override their interests, rights, and freedoms — or unless the processing is for the establishment, exercise, or defense of legal claims.

"Compelling legitimate grounds" is a high bar. It's not enough to say the processing is useful to you. You need to show that your interest is sufficiently strong and specific to override the individual's objection in their particular circumstances.

**What this means in practice:** If you rely on legitimate interest, you must provide a clear, easy way to object. Buried in page 12 of your privacy policy is not sufficient. The right to object must be clearly communicated at the first point of contact and must be easy to exercise.

---

## Consent vs. Legitimate Interest — When to Use Which

Both are valid lawful bases for processing personal data in many situations. Choosing between them isn't arbitrary — it has operational consequences.

**Use consent when:**
- You're not confident the balancing test would favor you
- The processing has a high privacy impact on individuals
- You want flexibility to use the data for future purposes you haven't yet defined
- The processing involves sensitive data categories (though consent alone may not be sufficient for Article 9)

**Use legitimate interest when:**
- Consent is impractical — for example, existing customer relationships where an ongoing consent interaction would be burdensome and unexpected
- The processing has low privacy impact and individuals would reasonably expect it
- You have a specific, documented business need and can demonstrate it clearly

One important consideration: if you choose consent, individuals can withdraw it, and you must stop processing. If you rely on legitimate interest and the individual objects, the bar to continue processing is high. Neither basis lets you process data indefinitely without accountability — they just impose different ongoing obligations.

---

## Auditing Your Current Lawful Bases

If you're not sure what lawful basis you're relying on for various processing activities, that's the first problem to fix. A lawful basis mapping exercise involves listing every processing activity, identifying the data involved, and documenting the lawful basis for each one.

Start with what your website actually collects. Many compliance exercises fail because organizations think they know what data they process but haven't looked closely. Third-party scripts, analytics tools, embedded widgets, and ad pixels often collect data that no one on your team explicitly decided to collect.

**[Run a free scan at app.custodia-privacy.com/scan](https://app.custodia-privacy.com/scan)** to see exactly what your site collects — cookies, trackers, and third-party scripts — before you start mapping lawful bases. You can't do this exercise on assumptions.

Once you have the data inventory, map each processing activity to a lawful basis and document your reasoning. For any activity where you're relying on legitimate interest, write a brief LIA. Custodia's compliance dashboard helps you track this across all your sites and flag activities that lack documented lawful bases.

---

*Last updated: March 2026*
