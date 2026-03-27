# Google Analytics 4 and GDPR: How to Set Up GA4 Correctly for EU Users

*Is Google Analytics 4 GDPR-compliant? Not out of the box — but it can be. This guide walks through the five configuration changes that matter, where to find each setting, and what you risk if you skip them.*

---

## The Short Answer

**A standard GA4 installation is not GDPR-compliant for EU users.** Supervisory authorities in Austria, France, and Italy have all issued findings against Google Analytics implementations. The core problem isn't GA4 itself — it's the default configuration, which transfers personal data to US servers without adequate safeguards, collects IP addresses without anonymization controls, and enables cross-device tracking via Google Signals.

The good news: GA4 is configurable. With the right setup, you can collect meaningful analytics data from EU visitors while meeting your GDPR obligations. This guide shows you exactly what to change and where to find the settings.

---

## Why GA4 Has GDPR Problems by Default

Before getting to the fixes, it helps to understand what's actually going wrong with a vanilla GA4 installation.

### Data Transfers to US Servers

GA4 sends user data — including IP addresses and behavioral data — to Google's servers in the United States. Under the EU Court of Justice's Schrems II decision, these transfers require either Standard Contractual Clauses (SCCs) or verification that recipients provide equivalent protection. Google has updated its data processing agreements with SCCs, but several EU supervisory authorities have found that this is insufficient because US intelligence agencies can still access data under laws like FISA 702. The Austrian DSB, French CNIL, and Italian Garante all reached this conclusion when investigating Google Analytics implementations.

This doesn't mean you can't use GA4 in the EU. It means you need to minimize the personal data being transferred and ensure your legal basis is solid.

### IP Addresses Are Personal Data

Under GDPR, an IP address is personal data. GA4 collects IP addresses to derive location information. Even though Google claims not to log full IPs, the collection and processing still occurs — and that processing requires a legal basis. For analytics, that typically means either legitimate interests (which is increasingly difficult to defend for tracking) or consent.

### Cross-Site Tracking via Google's Advertising Network

By default, GA4 with Google Signals enabled pulls in cross-device and cross-site behavioral data from Google's advertising network. This means GA4 isn't just tracking what users do on your site — it's enriching that data with what Google knows about those users from across the web. That's a significant expansion of data processing that most GA4 users haven't explicitly authorized.

### Default Data Retention and Modeling Settings

Out of the box, GA4 retains user-level and event-level data for 14 months. For GDPR compliance, that's far longer than necessary for most analytics use cases. GA4 also enables behavioral modeling by default, which fills gaps in your data using statistical methods — but this modeling uses cross-user data signals in ways that may not align with what you've disclosed in your privacy policy.

---

## The 5 Things You Need to Configure for GDPR Compliance

### 1. Consent Mode v2

This is the most important configuration — and the most commonly done wrong.

Consent Mode v2 is Google's framework for passing user consent signals to GA4 (and other Google tags) so they can adjust their behavior based on what the user has accepted. **GA4 must not load — and must not fire any measurement requests — until you know what the user has consented to.** Consent Mode is how you enforce that.

There are four parameters in Consent Mode v2:

- `analytics_storage` — controls whether analytics cookies can be set
- `ad_storage` — controls whether advertising cookies can be set
- `ad_user_data` — controls whether user data can be sent to Google for advertising
- `ad_personalization` — controls whether Google can use that data to personalize ads

**All four parameters must be set to `denied` by default** for EU users before GA4 initializes. When a user grants consent via your banner, the relevant parameters update to `granted`.

The critical detail is timing: the consent default must fire before GA4 initializes, not after. If GA4 loads and fires a page view before the consent default is set, that request goes out without any consent controls — defeating the entire mechanism.

For a full walkthrough of how Consent Mode v2 works and how to implement it, see our dedicated guide: [Google Consent Mode v2: What It Is, Why It's Mandatory, and How to Implement It](/blog/google-consent-mode-v2).

### 2. IP Anonymization

Unlike Universal Analytics (where IP anonymization was off by default and had to be manually enabled), **GA4 anonymizes IP addresses by default**. You don't need to add the anonymize_ip parameter the way you did in UA.

That said, verify this is actually active for your property:

1. Go to **GA4 Admin**
2. Select your data stream under **Data Streams**
3. Click **Configure tag settings**
4. Look under **Show all** — confirm IP anonymization is listed as enabled

This won't appear as a setting you can toggle on or off (it's enforced at the Google infrastructure level for GA4), but verifying in the Admin panel confirms your stream is properly configured.

IP anonymization reduces GDPR exposure but doesn't eliminate it. GA4 still processes the full IP temporarily to derive location data before discarding it — a distinction that matters under strict GDPR interpretations. This is one reason the supervisory authority findings focused on the transfer itself, not just whether IPs were logged.

### 3. Data Retention Settings

GA4's default data retention period is 14 months for user-level data. The GDPR's storage limitation principle requires you to keep personal data only as long as necessary for the purpose it was collected. For most analytics use cases, 14 months is difficult to justify.

Reduce retention to 2 months:

1. Go to **GA4 Admin**
2. Under **Data Settings**, select **Data Retention**
3. Change **User data and event data retention** to **2 months**
4. Make sure **Reset user data on new activity** is turned off (leaving it on extends retention each time a user returns, which undermines the limit)

If you need longer retention for specific purposes (year-over-year comparisons, for example), document the justification and update your privacy policy to reflect it. Two months is a defensible default that satisfies most operational analytics needs.

### 4. Disable Google Signals

Google Signals is the feature that links GA4 data with Google's broader advertising network to enable cross-device tracking, demographic reporting, and remarketing audiences. When enabled, GA4 is no longer just measuring your site — it's participating in Google's cross-site data ecosystem.

For EU users, this is very difficult to justify under GDPR without explicit, informed consent for that specific purpose — and even then it's legally contested.

Disable or restrict Google Signals:

1. Go to **GA4 Admin**
2. Under **Data Settings**, select **Data Collection**
3. Toggle **Google Signals data collection** to off

If you need Google Signals for remarketing purposes (audience building for Google Ads), consider restricting it to non-EU traffic using region-specific data collection settings. This requires some additional configuration but lets you use Signals where your legal basis is stronger while protecting EU users.

Note: Disabling Signals will reduce demographic and interest reports in GA4. These reports are a secondary benefit that comes at a significant compliance cost — for most businesses, it's a worthwhile tradeoff.

### 5. Server-Side Tagging (Advanced)

This is not required for basic GDPR compliance, but it meaningfully improves your position if you want to go further.

In a standard GA4 setup, the user's browser sends data directly to Google's collection endpoints. Server-side tagging inserts a proxy server (typically running in your own cloud infrastructure) between the user's browser and Google. Your site sends data to your server; your server decides what to forward to Google and strips out data that shouldn't be transferred.

This gives you:

- Control over exactly what fields are sent to Google's US servers
- The ability to redact or hash identifiers before they leave your infrastructure
- A first-party data pipeline that's more resilient to browser-based tracking prevention

Setting up server-side tagging requires engineering work — a server-side GTM container deployed to a cloud provider. It's the right call for businesses handling significant EU traffic or operating in regulated industries.

---

## The Consent Banner Requirement

All of the configuration above only works if your consent banner is correctly integrated.

**GA4 must not load before consent for EU users.** If your banner appears after GA4 has already fired a page view request, you're collecting data without consent — regardless of how GA4 itself is configured.

What a compliant banner setup requires:

- **Load order**: The consent default (`denied` for all four parameters) fires before any Google tags initialize. In GTM, this means using a **Consent Initialization** trigger, not a standard Page View trigger.
- **Granularity**: Your banner must offer separate choices for analytics and advertising, not a single accept/decline toggle. GA4 analytics processing and advertising processing have different purposes and require separate consent.
- **Timestamped records**: You must be able to prove what a user consented to and when. Consent records should be stored with timestamps, user identifiers, and the specific purposes accepted.
- **GPC signal support**: The Global Privacy Control (GPC) browser signal is a machine-readable opt-out that browsers can send automatically. Your consent implementation should detect and honor it — some EU jurisdictions (and US states like California) treat it as a binding opt-out signal.

---

## Testing Your Setup

Once you've made these changes, verify that everything is working as intended before assuming you're compliant.

**Google Tag Assistant**: Google's free Tag Assistant browser extension shows which tags fired, in what order, and what consent signals were active when they fired. You're looking for Consent Mode signals appearing before GA4 measurement requests.

**GA4 Admin — Data Collection panel**: In **GA4 Admin > Data Settings > Data Collection**, confirm that Consent Mode is listed as enabled. If it's not appearing here, your consent signals aren't reaching GA4 correctly.

**Browser DevTools — Network tab**: Open DevTools, go to the Network tab, filter for `google-analytics.com` or `analytics.google.com`, and reload your page. If GA4 network requests appear before you've interacted with the consent banner, your load order is wrong. No GA4 requests should fire for EU users until after consent is given.

**Incognito testing**: Always test in an incognito window to clear any previously stored consent state. What matters is what happens on a first visit from a user with no stored preferences.

---

## Common Mistakes

**Loading GA4 before setting the consent default.** This is the most common error and the one that makes everything else irrelevant. If GA4 fires before consent mode defaults are established, you're collecting unconsented data from the very first page view. Fix: use a Consent Initialization trigger in GTM, not a Page View trigger, for your consent default tag.

**Only passing v1 parameters.** Many implementations that were set up before 2024 only pass `ad_storage` and `analytics_storage`. The v2 parameters — `ad_user_data` and `ad_personalization` — are missing. Check your consent initialization tag and confirm all four parameters are present, even if you set them all to `denied` by default.

**Using Google Signals without EU traffic restrictions.** If Google Signals is on and you have EU visitors, you're participating in cross-site tracking for those users. Even with consent mode configured, Signals pulls in additional data processing that requires specific justification. Disable it globally or restrict it to non-EU regions.

**Not updating your privacy policy.** GA4 configuration changes need to be reflected in your privacy policy. If you're now using server-side tagging, your policy needs to describe that. If you're disabling Signals, remove references to cross-device tracking. Regulators look at whether your actual data processing matches what you've disclosed.

**Testing with stored consent from a previous session.** If you've previously accepted cookies on a site you're testing, your browser has stored that consent state. Always test in incognito mode to simulate a genuine first visit.

---

## What If You Don't Configure Any of This?

EU supervisory authorities have been active on Google Analytics specifically. These aren't hypothetical risks.

**Austria (DSB)**, January 2022: Found a standard Google Analytics implementation non-compliant with GDPR due to data transfers to the US without adequate safeguards. Required the website operator to stop using Google Analytics in its default configuration.

**France (CNIL)**, February 2022: Issued formal notices to multiple websites following the Austrian ruling, giving operators 30 days to bring their Google Analytics usage into compliance or stop using it.

**Italy (Garante)**, June 2022: Ruled that a standard GA implementation violated GDPR and ordered a website to stop using it, citing the same US transfer concerns.

These cases involved Universal Analytics, not GA4 — but the legal reasoning applies to GA4 equally. The problem is the transfer of personal data to US servers, not the specific Google Analytics version.

Beyond regulatory risk, there's a practical analytics cost. EU markets — particularly Germany, France, and the Netherlands — have high rates of consent decline when banners are presented as genuine choices. Without Consent Mode properly configured, you lose all measurement from those users. With Consent Mode properly configured, Google's behavioral modeling fills in aggregated estimates for non-consenting users, giving you usable trend data. Businesses with significant EU traffic can be making decisions based on 40–60% of actual EU user activity when Consent Mode is absent.

---

## Let Custodia Handle the Hard Parts

Correct GA4 GDPR setup requires getting four configuration changes right, keeping a consent banner's load order synchronized with GA4's initialization, maintaining timestamped consent records, and staying current as Google updates its requirements.

Custodia handles Consent Mode v2 automatically — the correct load order, all four v2 parameters, granular per-purpose signals, and GPC support. The consent default fires before GA4 initializes. When a user makes their choice, the right parameters update. Your analytics keep working; your compliance position is sound.

**[Scan your site to see if your current GA4 setup is compliant →](https://app.custodia-privacy.com/scan)**

See exactly what's firing, when, and whether Consent Mode signals are correctly controlling your GA4 implementation — no signup required.

---

*Last updated: March 2026*
