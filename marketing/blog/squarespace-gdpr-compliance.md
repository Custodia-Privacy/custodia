# Squarespace GDPR Compliance: A Practical Guide for Site Owners

*Squarespace is a popular choice for businesses, portfolios, and online stores. Like any platform that handles personal data, GDPR compliance depends as much on how you configure it as on what Squarespace provides.*

---

## What Squarespace Handles

Squarespace has done real work on the compliance infrastructure side. Before focusing on the gaps, it's worth understanding what's genuinely covered.

**Data Processing Agreement (DPA):** Squarespace provides a DPA covering its role as your data processor. This is a legal requirement under GDPR, and Squarespace makes it available through its legal documentation.

**EU data transfers via Standard Contractual Clauses (SCCs):** Squarespace processes data in the US and uses SCCs to legitimize transfers from the EU. This covers the transfer mechanism for data flowing through Squarespace's own infrastructure.

**Cookie Banner feature:** Squarespace includes a built-in cookie consent banner (found under Settings → Cookies & Visitor Data). It can notify visitors and, in opt-in mode, require action before setting certain cookies.

**Form submission management:** Squarespace's native forms include options for GDPR consent checkboxes — you can configure these to be unchecked by default and collect explicit opt-in for newsletter signups.

**GDPR-ready newsletter opt-in checkboxes:** Email newsletter blocks can include an opt-in checkbox configured to be unchecked by default — a requirement for valid consent under GDPR.

As a data processor, Squarespace takes its obligations seriously. The question is what happens on your site — the third-party scripts, embeds, and integrations that Squarespace doesn't control.

---

## Where the Compliance Gap Is

Squarespace's built-in cookie banner is functional but basic. It notifies visitors that your site uses cookies, and in opt-in mode it can require acknowledgment before Squarespace sets its own cookies. What it doesn't do reliably is block third-party scripts from firing before a visitor consents.

This matters under GDPR because non-essential cookies and trackers must not fire until after active consent is given. If Google Analytics, a social media embed, or a third-party form tool loads the moment a visitor arrives — before they've interacted with any consent banner — you're processing data before you have a legal basis to do so.

The compliance gap on most Squarespace sites comes from three places:

**Third-party integrations.** Google Analytics, Meta Pixel, YouTube embeds, Mailchimp newsletter blocks — each one sends visitor data to an external service the moment it loads. Squarespace's banner doesn't automatically block these.

**Code injection.** Squarespace allows custom code in the header and footer via Settings → Advanced → Code Injection. Scripts added here load on every page regardless of consent status.

**Your privacy policy.** Squarespace provides a basic privacy policy template. That template doesn't know which analytics tools you've connected, which payment processors handle your transactions, or which email marketing platform receives your subscriber list. The content of your privacy policy is your responsibility, not Squarespace's.

---

## The Third-Party Problem on Squarespace

Every integration you connect to your Squarespace site is a new data processor you're legally responsible for disclosing. Here's a realistic list of what most Squarespace sites are running:

**Analytics and advertising:**
- Google Analytics / GA4 — loads tracking scripts on page view; requires consent for EU visitors
- Meta Pixel — fires conversion events and behavioral data to Meta's servers
- Google Ads conversion tracking — similar to GA4 in terms of consent requirements

**Email marketing:**
- Mailchimp and Klaviyo newsletter blocks — sync subscriber data to external platforms
- These connections need DPAs with the respective vendors and disclosure in your privacy policy

**Video embeds:**
- YouTube and Vimeo embeds load third-party scripts on page load — before any consent is given
- YouTube's standard embed includes tracking cookies; Vimeo has its own data practices

**E-commerce:**
- Squarespace Payments (powered by Stripe) — a separate data processor handling financial and identity data
- PayPal — a separate processor with its own GDPR obligations
- Both need to be named in your privacy policy

**Scheduling:**
- Acuity Scheduling — owned by Squarespace but operates under a separate DPA; customer booking data flows to Acuity's systems
- If you use Acuity, you need to address it separately from your main Squarespace DPA

**Chat and support:**
- Tidio, Intercom, Drift, and similar tools added via code injection load immediately on page view
- These tools collect visitor IP addresses and session data before any consent interaction

The typical Squarespace site has more active data processors than the owner realizes. Inventory them before you assume you're compliant.

---

## Step 1 — Scan Your Site

Before changing anything, you need a complete picture of what your site is actually doing with visitor data. A scan covers what a visual inspection of your settings won't: scripts loaded by embedded blocks, third-party fonts phoning home, social media embeds activating on page load, and code injection running outside any consent flow.

Run a free scan at [app.custodia-privacy.com/scan](https://app.custodia-privacy.com/scan). The scanner loads your pages the way a real visitor would and captures every cookie, tracker, and third-party connection that fires. It takes about 60 seconds and costs nothing.

The results give you a complete list of processors before you make any decisions about what to fix.

---

## Step 2 — Configure Squarespace's Cookie Banner Properly

Squarespace's cookie banner is found at **Settings → Cookies & Visitor Data → Cookie Banner**. Here's how to configure it properly:

**Enable the banner.** It's off by default. Turn it on.

**Set it to opt-in mode for EU visitors.** In the banner settings, choose the option that requires visitors to actively accept before cookies are set. This is the difference between a compliant opt-in and a decorative notification.

**Customize the message.** Don't use the default placeholder text. Your cookie banner should tell visitors specifically what you're using cookies for — analytics, marketing, functional purposes. Vague language like "we use cookies to improve your experience" is not sufficient under GDPR's transparency requirements.

**Understand the limitation.** Squarespace's cookie banner manages Squarespace's own cookies and some integrated features. It does not block scripts loaded via code injection, third-party embeds added through blocks, or external tools connected via integrations. For those, you need additional measures — or a consent management platform that can intercept all scripts regardless of how they're loaded.

---

## Step 3 — Handle YouTube and Video Embeds

YouTube and Vimeo embeds on Squarespace load third-party scripts immediately on page load — before any consent is given. A visitor who hasn't clicked "Accept" on your cookie banner will still have YouTube tracking cookies set the moment they see a page with an embedded video.

**For YouTube:** Switch from the standard embed URL to Privacy-Enhanced mode by using `youtube-nocookie.com` in place of `youtube.com` in your embed URL. This reduces but does not eliminate tracking. The most GDPR-compliant approach is to replace the video embed with a static preview image and only load the actual player after a visitor clicks to play — or after they've consented.

**For Vimeo:** Vimeo offers a "do not track" parameter and a privacy settings option in your Vimeo account. Enable these and use the privacy-enhanced embed options.

**The best approach for both:** Use a custom HTML block with a click-to-play setup, or configure your consent management solution to block video embeds until consent is granted. If you've added YouTube or Vimeo via code injection, ensure the script only loads post-consent.

---

## Step 4 — Update Your Privacy Policy

Squarespace provides a basic privacy policy template accessible through your site's legal pages. It's a starting point. It is not an accurate description of what your specific site does with visitor data.

Under GDPR, your privacy policy must name every data processor that handles personal data from your site. For each processor, it should describe:
- What data they receive
- Why (the purpose and legal basis)
- Where they're based and how transfers are handled
- A link to their own privacy policy

If you use Google Analytics, name Google. If you use Stripe or Squarespace Payments, name them. If Mailchimp receives your subscriber list, name Mailchimp. If Acuity Scheduling processes your booking data, name Acuity.

A policy generated from an actual scan of your site is more reliable than a template that guesses at your configuration. As you add or change integrations, your policy needs to stay current.

---

## Step 5 — Squarespace Commerce GDPR

If you run a Squarespace Commerce store, you have additional compliance obligations beyond what applies to a standard content site.

**Name your payment processors.** Squarespace Payments is powered by Stripe. If you accept PayPal, that's a separate processor. Both need to appear in your privacy policy with a description of what transaction and identity data they handle.

**Set up order data retention limits.** GDPR's storage limitation principle requires you to keep personal data only as long as necessary. Review how long you retain customer order data and set a retention policy. For most businesses, keeping order data for the duration of applicable tax and legal requirements (typically 6–7 years) is defensible; keeping it indefinitely is not.

**Enable guest checkout.** Squarespace Commerce supports guest checkout — allow it. Requiring account creation to complete a purchase collects more data than necessary and creates an unnecessary data retention obligation for customers who may never return.

**Prepare a DSAR process for customer data.** EU customers and California consumers have the right to request all personal data you hold on them and ask for deletion. Squarespace's admin tools let you access and delete order data from within the platform, but a complete DSAR response also covers any data held in your email marketing platform, payment processor, and any other integrated service.

Set up a way to receive these requests (a dedicated email address or a form), a way to track the 30-day GDPR response deadline from receipt, and a checklist of all systems to search when a request arrives.

---

## The Full Compliance Stack

Squarespace handles its obligations as a data processor well. Your compliance as the data controller — getting consent right, blocking scripts before consent, maintaining an accurate privacy policy, handling DSARs — is still your responsibility.

For consent management, an accurate privacy policy, and DSAR handling all in one place, Custodia scans your site and builds from real data rather than guessing at your configuration. Plans start at $29/month.

Start at [app.custodia-privacy.com/scan](https://app.custodia-privacy.com/scan) — see exactly what's running on your Squarespace site before you change anything.

---

*Last updated: March 2026*
