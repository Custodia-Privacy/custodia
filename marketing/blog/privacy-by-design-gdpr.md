# Privacy by Design: The GDPR Principle That Affects How You Build Products

*Privacy by design isn't a buzzword — it's a legal requirement under GDPR Article 25. Here's what it means in practice, what it requires you to do (and not do), and how to audit whether your product meets it.*

---

## What Privacy by Design Means Under GDPR

GDPR Article 25 imposes a requirement called "data protection by design and by default." It has two distinct parts.

**By design** means you must implement appropriate technical and organizational measures at the design stage to implement data-protection principles effectively. Privacy considerations aren't something you bolt on after a feature ships — they're supposed to be built into it from the start.

**By default** means that by default, only personal data necessary for each specific purpose is processed. The least privacy-invasive option is the starting point, not an opt-in setting buried in account preferences.

This applies to data controllers — the organizations that decide why and how personal data is processed. It also applies to anyone who designs products or services for controllers. If you're a SaaS company and your customers use your product to process their users' data, Article 25 applies to you directly. You're not just building a product — you're providing infrastructure for your customers' compliance.

The Article 25 obligation isn't theoretical. It's an enforceable requirement that data protection authorities have cited in investigations. Ignoring it doesn't just create legal risk — it creates architectural debt that's expensive to fix later.

---

## The 7 Foundational Principles

Privacy by design predates GDPR. Ann Cavoukian, former Information and Privacy Commissioner of Ontario, developed the framework in the 1990s. GDPR formally adopted its principles into law. Here's what each one means:

**1. Proactive not reactive** — Address privacy risks before they materialize. Don't wait for a breach or a regulator's letter to think about data protection. This means building privacy reviews into your development process, not just your incident response playbook.

**2. Privacy as the default** — Users shouldn't have to do anything to protect their privacy. The default settings should be the most privacy-friendly. If you have a setting that limits data collection, it should be on by default, not something users have to find and enable.

**3. Privacy embedded into design** — Privacy is not an add-on. It's built into the product architecture from the beginning. The data model, the access controls, the retention logic — these should all reflect privacy requirements, not be retrofitted around them.

**4. Full functionality — positive-sum** — Privacy and functionality are not a zero-sum trade-off. You don't have to sacrifice product quality to protect user data. Good privacy design achieves both. This principle pushes back on the common excuse that privacy requirements make products worse.

**5. End-to-end security** — Data protection lasts throughout the entire lifecycle of the data. Collected, stored, used, and deleted — security applies at every stage. This includes encryption at rest and in transit, secure deletion when data is no longer needed, and controls on who can access what.

**6. Visibility and transparency** — Users should be able to verify what data you collect and how you use it. Your privacy policy should describe your actual practices, not aspirational ones. Your data flows should be documented, internally and externally.

**7. Respect for user privacy** — Keep it user-centric. Design around the interests of users, not just business interests. Give users meaningful control over their data — not dark patterns, not deliberately confusing interfaces, not buried settings.

---

## What "Data Minimization" Requires

Article 5(1)(c) of GDPR states that personal data must be "adequate, relevant and limited to what is necessary in relation to the purposes for which they are processed." This is the data minimization principle, and it has direct implications for product design.

The practical test is simple: for every piece of data you collect, ask whether you actually use it for the purpose you stated. If you collect it and don't use it, you shouldn't be collecting it.

**Don't collect data you don't use.** If your signup form asks for a phone number and your product never sends SMS or makes calls, remove the field. If your analytics platform is capturing keyboard events or session recordings but no one reviews them, turn it off.

**Delete data you no longer need.** Data minimization isn't just about what you collect — it's about how long you keep it. Inactive accounts, expired trials, churned customers — you likely don't need to retain their data indefinitely. Set retention periods and enforce them.

**Don't retain data indefinitely.** GDPR's storage limitation principle (Article 5(1)(e)) requires that data be kept "no longer than is necessary for the purposes for which the personal data are processed." This requires you to actually define retention periods, not just assume you'll deal with it later.

**Design forms to ask for minimum necessary information.** Every field on every form is a data collection decision. Make less-common fields optional rather than required. If company size or date of birth isn't necessary for the service you're providing, don't require it.

---

## Practical Privacy by Design Checklist for SaaS Products

Use this checklist to audit whether your product meets the baseline requirements of privacy by design. These aren't aspirational — they reflect what regulators expect.

- **Do you collect only the data you actually use?** Map what you collect to what you use it for. If there's no clear use case, stop collecting it.

- **Are less-common fields optional rather than required?** Phone number, date of birth, job title, company size — if these aren't necessary for core functionality, they should be optional.

- **Do you automatically delete inactive user data after a defined retention period?** You should have a retention policy and a mechanism to enforce it — not just a line in your privacy policy.

- **Is personal data encrypted at rest and in transit?** TLS in transit is table stakes. Encryption at rest for databases storing personal data is increasingly expected and should be standard.

- **Do you have role-based access controls so employees only see data they need?** Not everyone on your team needs access to customer data. Principle of least privilege applies to your internal systems as much as to user-facing ones.

- **Are you logging access to personal data for audit trails?** If a regulator asks who accessed a specific customer's data and when, can you answer that? Audit logs for sensitive data access are part of security under Article 32.

- **Do new features go through a privacy review before launch?** There should be a checkpoint — even a lightweight one — where someone asks the privacy questions before code ships.

- **Can users export their data?** GDPR Article 20 gives users the right to data portability. You need a mechanism to export a user's data in a structured, machine-readable format.

- **Can users delete their account and data?** Article 17 gives users the right to erasure. Deletion needs to propagate — not just deactivate the account but actually remove personal data from your databases, backups included per your retention schedule.

---

## When You Need a DPIA (Privacy Impact Assessment)

GDPR Article 35 requires a Data Protection Impact Assessment for processing that is "likely to result in a high risk to the rights and freedoms of natural persons." Specific triggers include:

- **Large-scale profiling** — systematic evaluation of personal aspects such as performance at work, economic situation, health, personal preferences, or behavior
- **Processing special categories of data** at large scale — health data, biometric data, data concerning racial or ethnic origin, political opinions, religious beliefs, sexual orientation
- **Systematic monitoring of publicly accessible areas** — CCTV, tracking behavior online

Even when a DPIA isn't technically required, it's good practice for any new feature that handles significant personal data. A DPIA is a structured process to identify privacy risks, assess their severity and likelihood, and document the measures you're taking to mitigate them. It's not a legal document — it's an engineering and product exercise.

Running a DPIA before a high-risk feature launches is significantly easier than retrofitting privacy controls after the fact. It also creates a record that demonstrates you thought about privacy before shipping, which matters in any regulatory investigation.

---

## Embedding Privacy Reviews in Your Development Process

The goal isn't a separate compliance track — it's integrating privacy into the process you already have. Here's a practical approach:

**Add a privacy section to your feature spec template.** For every feature touching personal data: what data does it collect, for what purpose, for how long, who has access, and what's the legal basis. This takes ten minutes per spec and surfaces problems before they're coded.

**Require a brief privacy review for any story that touches personal data.** This doesn't mean a lawyer reviews every pull request. It means someone on the team asks the five basic questions before the story is accepted: what data, why, how long, who sees it, and what's the legal basis.

**Document your data flows.** Maintain a record of what personal data flows through your system — where it's collected, where it's stored, what third parties receive it, and when it's deleted. This is called a Record of Processing Activities (ROPA) under GDPR Article 30, and it's a legal requirement for most organizations. More practically, you can't manage what you haven't mapped.

**Run a quarterly data audit.** Compare what you're collecting to what you actually use. Data collection tends to accumulate — fields added for features that were deprecated, analytics tools that were never properly configured, integrations that were turned off but still receive webhooks. A quarterly review keeps it under control.

---

## Privacy by Design for Third-Party Integrations

Every third-party SDK, analytics platform, or API you add to your product is a new data processor under GDPR. When you integrate a third-party tool, you're extending your data collection surface to include everything that tool does.

Privacy by design means evaluating these integrations before you build them, not after. The questions to answer before adding any third-party tool:

- What personal data does this tool collect from my users?
- Is collecting that data necessary for the functionality I'm adding?
- Do I have a Data Processing Agreement with this vendor?
- Does my privacy policy disclose this tool's data collection?
- Do my consent mechanisms cover this tool's use of data?

This is harder than it sounds because many third-party tools aren't transparent about what they collect. A JavaScript library that adds a feature widget may also be fingerprinting users and sending data to ad networks. An analytics SDK may be collecting more data than its documentation suggests.

A site scanner is one of the most useful tools for this. [app.custodia-privacy.com/scan](https://app.custodia-privacy.com/scan) surfaces what third parties are actually loading on your site — not what your integrations documentation says you're loading, but what's actually executing in your users' browsers. If there are trackers or tools you didn't knowingly add, you'll find them there.

Third-party integrations are where privacy by design gets complicated at scale. Each one is a business decision with a compliance dimension. Treating them that way — with a review process before integration rather than a cleanup exercise after — is what Article 25 actually requires.

---

*Last updated: March 2026*
