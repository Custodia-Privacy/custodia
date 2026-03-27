# Hotjar and GDPR: Is Session Recording Legal and How to Configure It Correctly

*Session recording tools like Hotjar are powerful for understanding user behavior. They're also one of the more sensitive categories of tracking under GDPR. Here's what makes them legally complex and how to use Hotjar without creating a compliance problem.*

---

## Why Session Recording Is Uniquely Sensitive Under GDPR

Session recording captures everything a user does: mouse movements, clicks, scrolling, form input. Unlike a page view or a click event, a recording is a continuous behavioral trace — a replay of exactly what a real person did on your site.

That's powerful for UX research. It's also one of the more invasive forms of data collection on the web.

The sensitivity comes from what session recordings can inadvertently capture. If a user starts filling in a form — even partially, even if they abandon it — that data may be captured in the recording. This can include names, email addresses, search queries, and in worst-case misconfigurations, passwords or payment details.

GDPR treats behavioral profiling seriously. Recording what a user does across a session builds a detailed behavioral profile. Depending on how data is stored and linked, this may constitute profiling as defined in GDPR Article 4(4): "any form of automated processing of personal data consisting of the use of personal data to evaluate certain personal aspects relating to a natural person."

This means session recording requires a clear legal basis — either valid consent or a carefully documented legitimate interest. Neither is automatic.

---

## Hotjar's Official GDPR Position

Hotjar has done substantial work on the compliance side. As a data processor, they have:

- A Data Processing Agreement (DPA) available to all customers
- EU-based data storage (AWS in Ireland and Frankfurt)
- Built-in suppression features for sensitive content
- A dedicated privacy program including GDPR documentation

They've also integrated with IAB TCF 2.0 and provide guidance on consent mode implementations.

What Hotjar offers is a GDPR-capable platform. Whether your implementation is actually compliant is a different question — one that depends almost entirely on your configuration and whether you've connected Hotjar to a proper consent mechanism.

The compliance responsibility sits with you as the data controller. Hotjar processes data on your behalf, under your instructions. If Hotjar records EU visitors before they've consented, that's not a Hotjar compliance failure. It's yours.

---

## The Default Hotjar Problem

Here's the problem with a standard Hotjar installation: by default, Hotjar loads on page load.

This means the script initializes, begins capturing mouse movements, and starts recording — before any consent banner has appeared. For EU visitors, you're recording their session before they've had any opportunity to agree to it.

This is not an edge case. It's how most Hotjar installs work. The snippet goes in the `<head>` tag, it fires immediately, and the recording starts. The consent banner is typically injected by a separate script that loads slightly later.

Even Hotjar's own documentation acknowledges this problem and recommends waiting for user consent before initializing the script.

The practical consequence: if you've installed Hotjar using the default embed snippet and you serve EU visitors, you're almost certainly recording sessions without valid consent. This creates meaningful GDPR exposure — not because session recording is prohibited, but because you haven't obtained the consent required to do it.

---

## Input Field Suppression — The Critical Setting

Hotjar automatically suppresses password fields. It does not automatically suppress all form inputs.

This matters because any unmasked text field in a session recording can capture what a user types — their name, email address, search terms, support message content. If a user starts filling in a checkout form and abandons it, you may have captured their partial address. If a user types in a search box, you've recorded their query.

The safest setting is to suppress all text inputs globally. In Hotjar:

**Settings → Sites & Organizations → Privacy → Suppress all text inputs**

Enabling this tells Hotjar to mask the content of all input fields in recordings. You lose some fidelity in your recordings, but you eliminate the risk of capturing typed personal data.

For more surgical control, use the `data-hj-suppress` attribute on individual elements:

```html
<input type="email" data-hj-suppress />
```

This suppresses that specific field without blanket suppression across your entire site. You can also add field IDs or CSS selectors to Hotjar's suppression list in the dashboard.

### What to always suppress

Regardless of your global settings, you should always suppress:

- All form input fields on pages containing personal data
- Any search fields where users might enter names or identifying information
- Support chat widgets or feedback forms
- Any field adjacent to sensitive user actions

The default partial suppression is not sufficient for GDPR compliance. Treat it as a starting point, not a complete solution.

---

## How to Implement Hotjar with Proper Consent

The core requirement: Hotjar should not initialize until after a user has actively given consent for analytics/behavioral tracking. There are three main implementation paths.

### Load Hotjar conditionally via JavaScript

The most direct approach: don't embed the standard Hotjar snippet in your `<head>`. Instead, conditionally initialize it after consent:

```javascript
// Only call this function after consent is granted
function initHotjar() {
  (function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid: YOUR_SITE_ID, hjsv: 6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r)
  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
}

// Call initHotjar() from your consent callback
```

This ensures the Hotjar script never loads until after your consent callback fires. Hotjar's own consent mode documentation provides an official version of this pattern.

### Via Google Tag Manager

If you're deploying Hotjar through GTM, configure a consent-based trigger:

1. Set up your CMP to integrate with Google Consent Mode v2
2. In GTM, add the Hotjar tag with a trigger condition: **Consent State = Analytics Granted**
3. Ensure consent defaults fire before any tags load (use Consent Initialization trigger, not Page View)

The GTM consent state variable handles the rest — the Hotjar tag will be blocked until the analytics consent signal is granted.

### Via your CMP's vendor list

Most CMPs (Cookiebot, OneTrust, Usercentrics, and others) include Hotjar in their vendor catalog. When you add Hotjar as a vendor:

1. Categorize it as "Analytics" or "Performance" — not "Functional"
2. Set that category to require explicit opt-in
3. Verify the CMP actually blocks the Hotjar script (not just "notes" it) before consent

Test this: open your site in an incognito window with DevTools open. Filter Network requests for `hotjar`. If you see requests to `static.hotjar.com` before you interact with your consent banner, Hotjar is loading without consent.

---

## Legal Basis for Session Recording

Two legal bases are potentially applicable for session recording.

### Consent

Explicit, informed, opt-in consent. The user sees a banner describing session recording, understands what it means, and actively accepts. This is the cleanest legal basis and the one regulators are most comfortable with.

The tradeoff: consent reduces your recording coverage. In markets with high banner interaction rates, you may see 40–70% of users decline analytics consent. Your Hotjar data will only cover consenting users, creating a selection bias in your UX research.

### Legitimate interest

Legitimate interest (Article 6(1)(f)) is possible for session recording, but it requires a proper Legitimate Interest Assessment (LIA) — a documented balancing test showing that your business need outweighs the privacy impact on individuals.

Where LI may hold up for session recording:
- Narrowly scoped recording on specific marketing pages only
- No recording of authenticated areas or pages containing personal data
- Recordings used only for UX improvement, not for targeting or profiling
- Short retention periods with strict access controls

Where LI is a harder argument:
- Recording logged-in users in account areas
- Recording checkout or form completion flows
- Using recordings for any purpose beyond direct UX improvement
- Long retention periods without clear justification

For most product teams doing general session recording, consent is the safer and simpler choice. If you want to use legitimate interest, document your LIA, get it reviewed, and be prepared to defend it.

---

## What Not to Record

Certain pages and flows should be explicitly excluded from Hotjar recording regardless of your legal basis.

Never record:
- **Payment and checkout pages** — card numbers, billing addresses, and order details create disproportionate risk
- **Account settings pages** — these contain concentrated personal data (email, address, preferences)
- **Login pages** — even with password suppression, recording login flows creates unnecessary risk
- **Support chat pages** — users may share sensitive personal information in support conversations
- **Any page that contains medical, financial, or other special category data**

Configure Hotjar to exclude these paths explicitly. In Hotjar's dashboard:

**Settings → Sites & Organizations → Recording → Excluded URLs**

Add specific paths (e.g., `/checkout`, `/account`, `/settings`, `/login`) to ensure recordings never capture these areas. This reduces your compliance surface area regardless of what legal basis you're using.

---

## Audit What's Loading on Your Site

Before you reconfigure Hotjar, it helps to see exactly what's firing and when. Many sites have Hotjar loading via multiple paths — direct snippet, GTM tag, and a CMP vendor entry, sometimes configured inconsistently.

[app.custodia-privacy.com/scan](https://app.custodia-privacy.com/scan) visits your site the way a real visitor would and captures every script, cookie, and tracker that fires on page load — including whether Hotjar is loading before consent is granted.

The scan flags Hotjar specifically if it initializes before a consent interaction. You'll see exactly what's firing, at what point in the page load, and whether it's gated on consent. It takes 60 seconds and doesn't require a signup.

If you're unsure whether your current setup is GDPR-compliant, that's the fastest way to find out.

---

*Last updated: March 2026*
