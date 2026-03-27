# GDPR for US Companies: Does It Apply to You and What Do You Need to Do?

*GDPR doesn't care where your company is based. If you have visitors or customers in the EU, it applies to you — no matter how small your business.*

---

## The Short Answer

Yes. GDPR applies to any organization that processes personal data of people in the EU, regardless of where the company is located. This is Article 3 of the regulation — the territorial scope provision — and it was written this way deliberately.

If your website is accessible from Europe and you collect any data from EU visitors — analytics, email sign-ups, contact forms, session recordings — GDPR applies. The location of your servers doesn't matter. Your company's incorporation doesn't matter. What matters is whether you're processing personal data of EU residents.

"Personal data" is broad. It includes names, email addresses, IP addresses, cookie identifiers, and any information that can identify a specific person. If you're running Google Analytics, you're processing personal data of every visitor — including EU ones.

---

## The "Establishment" vs "Targeting" Tests

GDPR reaches companies outside the EU through two distinct hooks.

### The Establishment Test

If you have an office, subsidiary, branch, or any other stable arrangement in the EU, GDPR applies automatically. This covers companies that technically run operations from the US but have EU presences — even a single remote employee based in Germany could count, depending on context.

### The Targeting Test

This is the one that catches most US businesses. If you offer goods or services to EU residents, or monitor their behavior, GDPR applies regardless of whether you have any EU presence at all.

Signs you're targeting EU users:
- Your site displays prices in Euros or GBP alongside USD
- You run Google Ads campaigns targeting EU countries
- You have EU-specific marketing campaigns or landing pages
- You ship physical products to EU addresses
- Your site is available in German, French, Spanish, or other EU languages
- You have case studies or testimonials from EU customers

For the vast majority of US businesses with EU exposure, it's the targeting test that applies. Running a SaaS product with a global sign-up page? You're targeting EU users. Running an e-commerce store that ships internationally? You're targeting EU users.

Even if you didn't intend to target EU users, if they find your site, sign up, and you collect their data — you're likely in scope.

---

## What US Companies Often Get Wrong

### "We're too small to be targeted"

Size doesn't determine whether GDPR applies to you — it affects enforcement likelihood, not legal obligation. A two-person startup with EU sign-ups is technically subject to GDPR. The practical risk is lower than for a company doing millions in EU revenue, but the legal exposure is real.

### "GDPR only applies to EU companies"

This is the most common misconception. It's also exactly what Article 3 was written to prevent. The drafters anticipated that companies would set up outside the EU to avoid the regulation. The extraterritorial scope closes that gap.

### "We don't have EU customers so it doesn't apply"

Anonymous EU visitors may still count under some interpretations. If your analytics tool collects IP addresses from EU-based visitors and assigns them persistent cookie identifiers, you're processing personal data — even if those visitors never became customers. The data subject doesn't have to transact with you.

### "We just need a cookie banner"

A cookie banner that says "we use cookies" and fires trackers before you click anything is not GDPR compliance. It's a signal that you've heard of GDPR without implementing it. Compliance requires actual consent before non-essential cookies load, a privacy policy that discloses your real data practices, and a process for handling user rights requests.

---

## What GDPR Actually Requires

If you're a US company with EU visitors or customers, here's what the regulation requires:

**Lawful basis for processing.** You need a legal justification for every category of personal data you collect. For marketing and analytics, this is usually consent. For contractual obligations (processing an order), it's the contract. You must document your basis and disclose it.

**Cookie consent before trackers fire.** Non-essential cookies — analytics, advertising, retargeting pixels — cannot load until the visitor actively consents. Not a pre-ticked box. Not implied consent from continued browsing. An explicit opt-in that blocks the scripts until the visitor says yes.

**Privacy policy disclosing EU user rights.** Your privacy policy must explain: what data you collect, why, the legal basis for each purpose, which third parties you share it with (specific companies, not just "partners"), how long you retain it, and how EU visitors can exercise their rights — access, deletion, correction, portability, objection.

**Ability to handle DSARs within 30 days.** Any EU resident can request a copy of all personal data you hold on them, ask you to delete it, or tell you to stop processing it. You have 30 days to respond. You need a process for this before the first request lands — not a panicked scramble after.

**Data processing agreements with your SaaS tools.** If you use any third-party tool that processes EU visitor data on your behalf — email providers, analytics platforms, CRMs, support software — you need a Data Processing Agreement in place with each one. Most reputable SaaS tools have a DPA available; you often just need to sign it.

---

## EU Representative Requirement

Article 27 of GDPR requires companies that are not established in the EU — but that regularly process EU personal data at scale — to designate a representative based in the EU. This representative acts as a point of contact for EU supervisory authorities and data subjects.

In practice, enforcement of this requirement against US-only companies is rare. There's no US mechanism for EU regulators to compel appointment. Most small US businesses with incidental EU traffic ignore this requirement entirely, and regulators have not pursued it aggressively against small operators.

That said, if you're doing meaningful EU revenue — hundreds of EU customers, regular EU marketing campaigns — it's worth being aware of and discussing with a privacy lawyer. As EU-US enforcement mechanisms evolve, what's practically ignored today may not be in five years.

---

## The Risk Picture for US Companies

EU regulators can't easily enforce against a US-only company that has no EU presence and no EU bank accounts. The practical enforcement path — serving notices, issuing fines, collecting — is genuinely difficult.

But the risk isn't zero, and it scales with EU exposure:

**EU-based customers can file complaints.** A data subject complaint with a supervisory authority (like the German DPA or France's CNIL) is a standard enforcement trigger. These authorities can investigate, make findings, and issue fines. For a US company with significant EU business, a complaint from a single unhappy customer can open a regulatory inquiry.

**Compliance becomes a commercial requirement.** If you want to sell to EU businesses — enterprises, government entities, regulated industries — they will ask about your GDPR compliance as part of procurement. Without it, you lose deals. This is often more immediately painful than regulatory risk.

**Fines can include EU-sourced revenue.** GDPR's fine framework calculates maximum penalties as a percentage of global annual turnover. But regulators assessing actual fines consider EU revenue as a relevant factor. If you're generating substantial EU revenue, the theoretical exposure is real.

**The risk profile in summary:** For a US-only business with incidental EU traffic, GDPR risk is low in practice. For a US company actively selling to EU customers, marketing to EU audiences, or building EU revenue, the risk is significant — both regulatory and commercial.

---

## The 5 Things to Do First

If you're a US company deciding where to start, this is the sequence that matters:

**1. Run a scan to see what your site actually collects from EU visitors.**
You can't fix what you can't see. A website scanner will show you every cookie, tracker, pixel, and third-party script firing on your site — including what fires before and after consent. Start here.

**2. Add proper cookie consent.**
Not a banner that loads everything and asks forgiveness. A consent mechanism that blocks non-essential scripts before consent is given, shows a clear accept/reject option, and logs consent for compliance records. Test it in incognito mode: if Google Analytics fires before you click "accept," your consent is broken.

**3. Update your privacy policy to disclose EU visitor rights.**
Your privacy policy should describe what you collect from EU visitors, the legal basis for each use, which third-party tools process their data, and how they can exercise rights (access, deletion, correction). Most template privacy policies are inadequate. Use one generated from your actual data practices.

**4. Get DPAs from your SaaS tools.**
Go through every tool that processes visitor or customer data: your email platform, analytics provider, CRM, support software, payment processor. Find their DPA, sign it, and keep a record. Most major platforms (Google, HubSpot, Mailchimp, Stripe) have DPAs ready to sign — it takes minutes per tool.

**5. Set up a DSAR process.**
Create a simple intake method — a form, a dedicated email address — and assign someone to handle requests. Know where user data lives: your database, your email tool, your analytics platform, any backups. You have 30 days to respond. Building the process takes an afternoon; not having it when the first request lands costs much more.

**Ready to see what your site is actually collecting from EU visitors?**

[Run a free scan at app.custodia-privacy.com/scan](https://app.custodia-privacy.com/scan) — no signup required. You'll see every tracker, cookie, and third-party script loading on your site in under 60 seconds.

---

*Last updated: March 2026*
