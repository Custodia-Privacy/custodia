---
title: "GDPR for Mobile Apps: What App Developers Must Do Before Launch"
description: "GDPR creates specific obligations for mobile app developers. This guide covers device identifiers, location consent, ATT framework, SDK auditing, children's apps, App Store privacy labels, and in-app DSAR handling."
date: "March 27, 2026"
tags: ["GDPR", "Mobile", "App Development"]
canonical: "https://app.custodia-privacy.com/blog/gdpr-mobile-apps"
---

# GDPR for Mobile Apps: What App Developers Must Do Before Launch

You've built the app. The UI is polished. The onboarding flow is smooth. The backend scales. Now — have you built the privacy compliance?

Most mobile developers haven't. Not because they're careless, but because GDPR for mobile apps is genuinely more complex than GDPR for websites. Mobile apps collect data that websites can't: device identifiers tied to advertising ecosystems, precise GPS coordinates, accelerometer readings, contact lists, camera roll access, and background activity that continues after the user has closed the app. Regulators know this. Enforcement reflects it.

This guide covers every GDPR mobile apps obligation a developer must address before shipping — from the App Store privacy labels on your listing to the in-app flow a user sees when they tap "Allow Location Access."

---

## Why Mobile Apps Face Specific GDPR Challenges

GDPR mobile apps compliance is harder than web compliance for several interconnected reasons.

**Device identifiers are pervasive and persistent.** The Identifier for Advertisers (IDFA) on iOS and the Google Advertising ID (GAID) on Android are designed to enable cross-app tracking. They're assigned at the device level, not the account level, and they follow users across every app they install. Under GDPR, these are personal data — and collecting them without a lawful basis is a violation.

**Permissions are a dual compliance moment.** When your app asks for access to location, contacts, camera, or microphone, you're simultaneously triggering the operating system's permission dialog and creating a GDPR obligation. The OS prompt and your GDPR consent mechanism are different things, and they both need to be handled correctly.

**Background data collection is invisible to users.** Apps can collect location data, sync contacts, and send data to analytics platforms in the background — after the user has closed the app and is no longer thinking about it. GDPR's transparency requirements apply to all of this, not just what happens during active use.

**Third-party SDKs do the heavy lifting — and the collecting.** Most apps embed analytics SDKs, crash reporting tools, advertising networks, and attribution platforms. Each one may independently collect and process personal data. As the app developer, you're responsible for understanding what every SDK collects, ensuring you have the legal basis to permit that collection, and disclosing it to users.

**The supply chain is long.** Your app talks to your backend. Your backend uses third-party services. Your SDKs call their own servers. A user's data may touch a dozen different systems during a single session — all of which require GDPR compliance consideration.

---

## Consent Before Permissions: The Legal Basis Problem

Here's where most GDPR mobile apps mistakes happen. Developers assume the iOS or Android permission dialog *is* the GDPR consent mechanism. It isn't.

When a user taps "Allow" on a system permission dialog, they're granting the app operating system access to that capability. They're not providing GDPR-compliant consent to have their data processed, shared with third parties, or used for analytics.

For GDPR purposes, you need a lawful basis *before* you request the permission — not provided by the permission itself. The available bases are:

- **Consent** (Article 6(1)(a)): The user has freely given, specific, informed, and unambiguous consent. This requires a genuine choice — the app must function without it, or offer a meaningful alternative.
- **Contract** (Article 6(1)(b)): Processing is necessary to perform the contract with the user. Location access for a navigation app may fall here. Location access for a recipe app almost certainly doesn't.
- **Legitimate Interest** (Article 6(1)(f)): After a three-part test — necessity, balancing, reasonable expectations — this can cover some analytics, fraud prevention, and security monitoring. It cannot be used for advertising tracking.

The practical implication: if your app uses location for advertising purposes, you need explicit GDPR consent — not just the system permission. Show your privacy information and obtain consent *before* the OS permission dialog appears.

---

## App Tracking Transparency (ATT) and GDPR

Apple's App Tracking Transparency framework, introduced in iOS 14.5, requires apps to obtain explicit permission before tracking users across apps and websites using the IDFA. The ATT prompt asks: "Allow [App] to track your activity across other companies' apps and websites?"

ATT and GDPR are parallel obligations — not the same thing. ATT governs cross-app tracking specifically. GDPR governs all personal data processing. You may need both:

- ATT permission before accessing the IDFA for advertising purposes
- GDPR consent before processing any personal data for purposes not covered by a stronger lawful basis

In practice, this means your GDPR mobile apps consent flow should appear before your ATT prompt. Explain to users what tracking involves and why, then let Apple's prompt follow. Users who understand and agree are more likely to grant both — and regulators expect the informed disclosure to come first.

Note that even if a user grants ATT permission, GDPR still applies. ATT is an Apple policy mechanism; GDPR is a legal requirement with fines attached.

---

## In-App Analytics: Firebase, Mixpanel, and Amplitude

Analytics SDKs are nearly universal in mobile apps, and each one creates GDPR mobile apps compliance obligations.

**Firebase Analytics** (Google) automatically collects device information, app instance IDs, and behavioral data. It sends this to Google's servers in the US — which triggers international data transfer obligations under GDPR. You must disclose Firebase in your privacy policy, have an appropriate lawful basis, and if relying on consent, gate Firebase initialisation until consent is obtained.

**Mixpanel** collects detailed behavioral event data linked to a distinct_id that persists across sessions. Under GDPR, this constitutes profiling. You need to disclose it, have a lawful basis, honour deletion requests (Mixpanel provides an API for this), and document the transfer to US servers via Standard Contractual Clauses.

**Amplitude** operates similarly. It provides a GDPR-compliant mode that anonymises data and supports deletion requests — but you have to configure it, not just install the SDK.

Practical steps for GDPR mobile apps analytics compliance:
1. List every analytics SDK in your app
2. Document what each one collects, where it sends data, and how long it retains it
3. Determine your lawful basis for each (consent is safest if the analytics isn't strictly necessary)
4. Configure your app to initialise analytics SDKs only after the appropriate consent is obtained
5. Implement opt-out: users must be able to withdraw consent and stop analytics collection
6. Honour deletion requests by calling each SDK's deletion API

---

## Push Notifications: Consent, Opt-Out, and Data Retention

Push notification consent has two distinct dimensions for GDPR mobile apps:

**Operating system permission.** iOS and Android both require explicit permission before an app can send push notifications. This is a system-level opt-in.

**GDPR lawful basis for the data processing.** Sending a push notification involves processing the device push token (a persistent identifier that functions as personal data), often combined with user behaviour data to determine what to send and when. This requires a lawful basis — typically consent.

Key compliance requirements:

- **Transparent disclosure before the OS prompt.** Before showing the system notification permission dialog, explain what you'll send and how often. Users should make an informed choice.
- **Granular opt-out.** Users must be able to opt out of marketing notifications independently of other app functionality. If your app sends both transactional notifications (order confirmations) and marketing notifications (promotions), users must be able to disable marketing without losing transactional alerts.
- **Data retention for push tokens.** Push tokens should be deleted when a user revokes notification permission or deletes their account. Retaining tokens for users who have opted out serves no legitimate purpose and violates GDPR's storage limitation principle.
- **Document consent.** Keep a record of when each user granted notification permission and what they were told at the time. If your consent language changes, users may need to re-consent.

---

## Device Identifiers as Personal Data

GDPR mobile apps compliance requires treating device identifiers as personal data — because they are.

The IDFA (iOS) and GAID (Android) are advertising identifiers designed to enable cross-app and cross-site tracking. The Article 29 Working Party (now the European Data Protection Board) has confirmed that advertising IDs are personal data when they can be linked to an individual, which they routinely can.

Other device identifiers that constitute personal data under GDPR:
- App instance IDs (Firebase generates these automatically)
- Push notification tokens
- Vendor IDs (IDFV on iOS — scoped per vendor, not user-resettable, persistent across reinstalls)
- Fingerprint components (screen resolution, device model, OS version, timezone — individually innocuous, combined potentially identifying)

Compliance implications:
- Do not collect the IDFA without ATT permission and a valid GDPR lawful basis
- Do not use device fingerprinting as a fallback when ATT is denied — this is specifically prohibited by Apple policy and almost certainly violates GDPR
- Disclose all device identifiers you collect in your privacy policy
- Provide users a mechanism to reset or delete identifiers tied to their account

---

## Location Data: Precise vs. Approximate and Consent Requirements

Location data is among the most sensitive categories that mobile apps commonly collect, and GDPR mobile apps rules treat it accordingly.

**Precise location** (GPS coordinates accurate to a few metres) reveals where a person lives, works, worships, seeks medical care, and associates. It is highly sensitive and requires strong justification. For most apps, the only acceptable basis is explicit consent — and only when the feature requiring location is actually being used.

**Approximate location** (city or region-level) carries lower sensitivity but still constitutes personal data requiring a lawful basis.

iOS and Android both now offer tiered location permission: "precise" or "approximate." Your app should:

1. Request only the precision level you actually need
2. Request "While Using" location access unless background location is strictly necessary for the app's core function
3. Obtain GDPR consent (not just the OS permission) before any location processing for analytics or advertising
4. Never use location data collected for one purpose (navigation) for a different purpose (advertising) without separate consent
5. Document your location data retention and ensure it is minimal — precise historical location trails are high-risk data

Background location access — where your app continues to track location when the user isn't actively using it — triggers the highest scrutiny. You must have a compelling legitimate need (a fitness tracking app recording a run), explicit consent, and a clear disclosure in your privacy notice.

---

## Children's Apps: COPPA, GDPR-K, and Age Gating

If your app is directed at children or likely to be used by children, you face a significantly stricter compliance environment for GDPR mobile apps.

**GDPR and children (Article 8):** For information society services offered directly to children, GDPR requires parental consent for children under 13 (member states can raise this to 16). Standard data processing consent is insufficient — parental verification is required.

**GDPR-K (children's data):** Children's personal data warrants "specific protection" under GDPR Recital 38. This means you cannot rely on legitimate interest for processing children's data, cannot use profiling for advertising, and must apply stricter retention limits.

**COPPA (for US markets):** The Children's Online Privacy Protection Act prohibits collecting personal data from children under 13 without verifiable parental consent. If your app appears on US app stores and could be used by children, COPPA applies regardless of where you're based.

**Apple and Google requirements:** Both app stores will categorise apps as appropriate for certain ages. Apps marked as children's apps face restrictions on third-party advertising SDKs, analytics, and data sharing. Configure your app store metadata accurately — incorrectly categorising a children's app as adult-only to avoid compliance requirements is a policy violation.

**Age gating:** If your app isn't directed at children but some users might be minors, implement age verification. This doesn't need to be bulletproof — a reasonable good-faith mechanism (date of birth entry, with flagging of inputs indicating minority) satisfies GDPR requirements for non-children's apps. Do not knowingly collect data from children under the applicable threshold without parental consent.

---

## Privacy Policy in the App and on the Store Listing

Your app requires a privacy policy in two distinct places — each with different requirements.

**In-app privacy policy:** Accessible from within the app without requiring a login. Should be prominently linked in your settings or onboarding flow. Must describe:
- Every category of personal data collected (not just what your code directly collects — what your SDKs collect too)
- The purpose for each category
- The lawful basis for each processing activity
- Third parties who receive data (analytics providers, advertising networks, cloud infrastructure)
- International data transfers and the safeguards in place
- Retention periods
- User rights under GDPR and how to exercise them
- How to withdraw consent
- Contact details for your data protection officer (if you have one) or privacy contact

**App store listing privacy policy:** A publicly accessible URL (not behind a login) pointing to your privacy policy. Both Google Play and the App Store require this before your app is approved. Regulators and journalists frequently check app store listings — make sure the URL resolves and the policy is current.

Keep your privacy policy in sync with your actual app behaviour. A mismatch between what your policy says and what your app does is independently actionable under GDPR.

---

## App Store Privacy Labels: Google Play and Apple App Store

Both major app stores now require developers to disclose data practices before app installation.

**Apple's App Privacy Labels** (required since December 2020) categorise data into "Data Used to Track You," "Data Linked to You," and "Data Not Linked to You." Apple definitions are specific — "tracking" has a precise meaning under ATT. Inaccurate privacy labels have led to app removals and regulatory attention. Before submitting, audit every SDK in your app and cross-reference with Apple's documentation.

**Google Play's Data Safety Section** (required since 2022) requires you to disclose what data your app collects, whether it's shared with third parties, whether collection is optional or required, and whether your app uses the data for tracking. Google cross-references submissions against code analysis and user reports. Incorrect declarations can result in app removal.

Key points for GDPR mobile apps compliance on both platforms:
- The labels must reflect the actual behaviour of your app *and* your SDKs
- "Optional" data collection means users can decline without losing core functionality
- If an SDK collects data that you don't use directly but the SDK vendor uses, you still must declare it
- Review and update labels every time you add, remove, or update an SDK

---

## SDK Auditing: Finding Every Third-Party SDK and What It Collects

SDK sprawl is the single most common source of GDPR mobile apps violations that developers don't know about.

A typical mobile app contains 10-30 third-party SDKs at launch. Each one may collect data, send it to external servers, and retain it. Most developers can't name all the SDKs in their app without looking.

How to audit your SDKs:

1. **Generate a complete SDK list.** Use your package manager (CocoaPods, Swift Package Manager, Gradle) to list all dependencies. Include transitive dependencies — an SDK may embed other SDKs.

2. **Check each SDK's privacy documentation.** Most major SDKs (Firebase, Amplitude, Adjust, Braze) publish data processing documentation and DPAs. Find them. If an SDK doesn't publish privacy documentation, that's a red flag.

3. **Sign DPAs where required.** If an SDK vendor processes personal data on your behalf, you need a Data Processing Agreement. Firebase, Amplitude, Mixpanel, and most major platforms offer DPAs — but you have to execute them.

4. **Confirm data destinations.** Where does each SDK send data? US-based services require a transfer mechanism under GDPR (Standard Contractual Clauses are the standard). Verify your DPAs include SCCs or that the vendor has another valid transfer mechanism.

5. **Remove SDKs you don't use.** Developers frequently leave SDKs in their codebase after switching to an alternative. Every unused SDK is unnecessary data collection. Remove it.

6. **Repeat for every SDK update.** SDK updates can introduce new data collection. Pin versions and review changelogs before updating in production.

---

## Data Minimisation in Mobile: Only Request What You Actually Use

GDPR's data minimisation principle (Article 5(1)(c)) requires that personal data be "adequate, relevant, and limited to what is necessary" for the stated purpose. In mobile apps, this principle is violated constantly.

Common minimisation failures:

- Requesting "Always On" location when the feature only needs "While Using"
- Requesting contact list access to suggest friends, then retaining the entire contact list on your servers
- Requesting camera access without limiting which photos the app can access (iOS 14+ photo library limited access helps here)
- Enabling all analytics events in an SDK when only a subset are relevant to your product decisions
- Retaining device identifiers indefinitely when they're only needed during active sessions

Before each permission request, ask: do we *actually* need this for the feature we're building, or is it convenient? Could we achieve the same outcome with less invasive data? If a user denies permission, does the core app still function?

Document your minimisation reasoning. Regulators appreciate evidence that you actively considered data necessity — it demonstrates good faith and reduces fine severity if a breach occurs.

---

## In-App DSARs: How Users Can Access and Delete Their Data

GDPR gives users rights including access (Article 15), rectification (Article 16), erasure (Article 17), and portability (Article 20). For GDPR mobile apps compliance, you must provide a mechanism for users to exercise these rights from within the app or from a clearly disclosed channel.

What this requires in practice:

**Access requests:** When a user asks for their data, you must provide a comprehensive response within 30 days. This means you must know where all their data lives — your backend, your analytics platforms, your CRM, your support system. Build the internal tooling to retrieve it before you need it.

**Deletion requests:** This is the most complex GDPR mobile apps right. Deleting a user's data means deleting it from:
- Your own database
- Your analytics platforms (Firebase, Amplitude, Mixpanel all have deletion APIs)
- Your CRM and email marketing platform
- Your customer support system
- Your backup systems (within a reasonable time)

Apple's "Delete Account" requirement (mandatory since June 2022) requires apps to allow users to delete their account and associated data from within the app itself. GDPR's right to erasure and Apple's policy are now aligned — a Delete Account flow is both a legal and an app store requirement.

**Portability:** Provide a data export in a machine-readable format (JSON is standard). This should cover the data the user provided to you and any data generated through their use of the service that's tied to their account.

**In-app mechanism:** Link to your DSAR submission form from your app's settings or profile screen. Don't require users to send an email — provide a structured form that captures the necessary information and creates a timestamped record.

---

## Practical Checklist: 8 Things App Developers Must Implement

1. **Audit every SDK** in your app — including transitive dependencies. Document what each one collects, where it sends data, and sign DPAs where required.

2. **Build a consent flow** that appears before OS permission dialogs and before SDKs are initialised. Obtain GDPR-compliant consent for any processing that requires it — especially analytics and advertising.

3. **Handle ATT correctly** on iOS — show your own consent UI before the ATT prompt, and respect users who decline IDFA access without degrading their experience.

4. **Complete App Store privacy labels** accurately — for both Apple (App Privacy section) and Google Play (Data Safety section). Labels must reflect SDK behaviour, not just your own code.

5. **Publish a complete privacy policy** accessible in-app (no login required) and from your app store listing. Include every data category, every SDK, every third-party recipient, and every transfer destination.

6. **Implement Delete Account** functionality within the app (required by Apple, mandated by GDPR). Ensure deletion propagates to all downstream systems.

7. **Apply data minimisation** — request only the permissions you need, at the precision level required, for the duration needed. Remove unused SDKs.

8. **Document everything** — your lawful basis decisions, your consent flows, your DPA agreements, your SDK audit results. GDPR accountability (Article 5(2)) requires you to *demonstrate* compliance, not just implement it.

---

## Is Your App's Web Presence Compliant Too?

Your mobile app probably has a landing page, marketing website, or web app. Everything above applies there too — and web compliance is where most GDPR violations begin: a Google Analytics script firing before consent, a Facebook Pixel tracking every visitor, a contact form without a compliant privacy notice.

[Custodia](https://app.custodia-privacy.com) scans your app's web presence and landing page for compliance gaps — cookie trackers loading before consent, missing privacy disclosures, and analytics tools configured incorrectly. The scan takes 60 seconds and is free. Run it before your app launches to make sure your web footprint doesn't undermine the mobile compliance work you've done.

GDPR for mobile apps is comprehensive. But it's not impossible. The developers who get it right build trust into their products from the start — and that trust increasingly becomes a competitive differentiator.

---

*Last updated: March 27, 2026. This post provides general information about GDPR and mobile app development. It does not constitute legal advice. Consult a qualified privacy professional for advice specific to your app and jurisdiction.*
