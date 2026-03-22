# Custodia — UI Microcopy

---

## Compliance Status Labels

### Overall Status
- **Compliant** (Green): Your site meets all detected regulatory requirements. Keep it up.
- **Needs attention** (Yellow): Some issues were found that should be addressed soon. None are critical.
- **Action required** (Red): Critical compliance gaps detected. These should be fixed immediately to avoid regulatory risk.

### Per-Regulation Status
- **GDPR — Compliant**: Your site meets GDPR requirements for EU visitors.
- **GDPR — Issues found**: {count} GDPR compliance gap(s) detected. [View details →]
- **CCPA — Compliant**: Your site meets CCPA/CPRA requirements for California residents.
- **CCPA — Issues found**: {count} CCPA compliance gap(s) detected. [View details →]

---

## Dashboard Labels

### Navigation
- Dashboard
- Scanner
- Consent Banner
- Privacy Policy
- Compliance
- DSARs
- Data Inventory
- Settings

### Dashboard Cards
- **Active trackers:** Cookies, pixels, and scripts currently detected on your site.
- **Consent rate:** Percentage of visitors who accepted at least one consent category.
- **Open DSARs:** Active data subject requests awaiting response.
- **Next scan:** When your next automated scan is scheduled.
- **Compliance score:** Your overall compliance posture across all applicable regulations.

---

## Scanner

### States
- **Ready to scan:** Enter a URL to start your first scan.
- **Scanning…** Crawling your site. This usually takes 1–2 minutes.
- **Scan complete:** Found {tracker_count} trackers across {page_count} pages. [View results →]
- **Scan failed:** We couldn't reach {url}. Check that the URL is correct and the site is publicly accessible.

### Tracker Classification Labels
- **Necessary:** Required for basic site functionality. Cannot be blocked.
- **Analytics:** Measures site usage and performance. Requires consent in most jurisdictions.
- **Marketing:** Used for advertising and retargeting. Requires explicit consent.
- **Functional:** Enables enhanced features like chat widgets or video embeds. Requires consent.
- **Unknown:** We detected this tracker but couldn't classify it automatically. [Review manually →]

### Tracker Detail
- **First seen:** {date}
- **Last seen:** {date}
- **Set by:** {domain or script name}
- **Data sent to:** {destination country/company}
- **Duration:** {session / persistent with expiry}
- **Consent required:** {Yes / No — depends on jurisdiction}

---

## Consent Banner

### Setup
- **Preview your banner:** This is how your consent banner will appear to visitors. [Customize →]
- **Installation:** Add this snippet to your site's `<head>` tag. [Copy code]
- **Banner not detected:** We can't detect the Custodia snippet on your live site. Make sure it's installed correctly. [Troubleshooting guide →]
- **Banner active:** Your consent banner is live and collecting consent.

### Visitor-Facing Banner Copy (Default)
- **Heading:** We value your privacy
- **Body:** We use cookies and similar technologies to provide the best experience on our site. You can choose which categories to allow. [Read our privacy policy →]
- **Accept all** / **Reject all** / **Manage preferences**

### Preference Center (Default)
- **Heading:** Privacy preferences
- **Body:** Choose which cookie categories you'd like to allow. You can change these settings at any time.
- **Save preferences** / **Accept all** / **Reject all**

---

## Privacy Policy Generator

### States
- **Generating…** Building your privacy policy based on scan results. This takes about 30 seconds.
- **Ready for review:** Your privacy policy has been generated. Review it before publishing.
- **Published:** Your privacy policy is live at {hosted_url}.
- **Update available:** Your site has changed since this policy was generated. [Review updates →]

### Editor
- **Auto-updated section:** This section was updated because we detected a change in your site's data practices. [See what changed]
- **Plain English:** (toggle) Show a plain-English explanation alongside each section.
- **Last updated:** {date}

---

## DSAR Management

### States
- **No requests yet:** When someone submits a data request, it will appear here.
- **New request:** {requester_name} submitted a {request_type} request. Deadline: {deadline_date}. [Review →]
- **In progress:** You're working on this request. {days_remaining} days remaining.
- **Overdue:** This request is past its regulatory deadline. Respond as soon as possible.
- **Completed:** Request fulfilled on {date}. [View response →]

### Request Types
- **Access request:** The individual wants a copy of their personal data.
- **Deletion request:** The individual wants their personal data deleted.
- **Correction request:** The individual wants to update inaccurate personal data.
- **Portability request:** The individual wants their data in a machine-readable format.
- **Opt-out request:** The individual wants to opt out of data sales or targeted advertising.

---

## Empty States

- **Dashboard (no sites):** Add your first website to get started. Custodia will scan it and build your compliance stack. [Add a website →]
- **Scanner (no scans):** No scans yet. Enter your website URL to run your first privacy scan. [Scan now →]
- **DSARs (no requests):** No data requests yet. When someone submits a request through your intake portal, it'll show up here. [Set up your DSAR portal →]
- **Data inventory (empty):** Your data inventory is empty. Start by cataloging what personal data you collect and where it's stored. [Add your first data source →]
- **Compliance (no sites):** Add a website to see your compliance status across all applicable regulations. [Add a website →]

---

## Success Messages

- **Scan complete:** Scan finished. {tracker_count} trackers found. [View results →]
- **Banner deployed:** Consent banner is live. We'll verify it on your next scan.
- **Policy published:** Privacy policy published at {url}. Link it from your website footer.
- **DSAR responded:** Response sent to {requester_name}. Request marked as complete.
- **Site added:** {domain} added. Running your first scan now…
- **Settings saved:** Your changes have been saved.
- **Export ready:** Your report is ready. [Download PDF →]

---

## Error Messages

- **Scan failed — unreachable:** We couldn't reach {url}. Check that the address is correct and the site is publicly accessible.
- **Scan failed — timeout:** The scan timed out. This can happen with very large sites. Try scanning a specific section. [Retry →]
- **Banner installation failed:** We can't detect your consent banner. Make sure the snippet is in your site's `<head>` tag and the page isn't cached. [Help →]
- **Policy generation failed:** Something went wrong while generating your policy. [Retry →] or [Contact support →]
- **Site limit reached:** You've reached the site limit for your plan. [Upgrade →] to add more websites.
- **Rate limited:** Too many requests. Please wait a moment and try again.
- **Generic error:** Something went wrong. Please try again. If the problem persists, [contact support →].

---

## Onboarding Flow

### Step 1: Add your website
**Heading:** What website do you want to protect?
**Input label:** Website URL
**Input placeholder:** e.g., yourcompany.com
**Helper text:** Enter your main website URL. You can add more sites later.
**CTA:** Scan my site →

### Step 2: Review scan results
**Heading:** Here's what we found on {domain}.
**Subheading:** {tracker_count} trackers detected across {page_count} pages.
**CTA:** Continue to setup →

### Step 3: Deploy consent banner
**Heading:** Deploy your consent banner.
**Subheading:** We've generated a banner based on your scan results. Copy this code snippet into your site's `<head>` tag.
**CTA:** I've installed it → / Skip for now

### Step 4: Publish privacy policy
**Heading:** Review your privacy policy.
**Subheading:** Auto-generated from your scan data. Review it, make any edits, then publish.
**CTA:** Publish policy → / Edit first →

### Step 5: Done
**Heading:** You're compliant.
**Subheading:** Your consent banner is deployed, privacy policy is live, and weekly monitoring is active. We'll email you if anything changes.
**CTA:** Go to dashboard →

---

## Tooltips

- **Compliance score:** A weighted score based on your status across all applicable privacy regulations. 100 means fully compliant.
- **Consent rate:** The percentage of visitors who accepted at least one non-essential cookie category after seeing your banner.
- **Data processor:** A third party that processes personal data on your behalf (e.g., analytics tools, payment providers).
- **DSAR:** Data Subject Access Request. A formal request from an individual to access, delete, or modify their personal data.
- **DPIA:** Data Protection Impact Assessment. Required under GDPR Article 35 for high-risk data processing.
- **Tracker:** Any technology that collects or transmits visitor data — cookies, pixels, scripts, local storage, or fingerprinting.
- **Jurisdiction detection:** Custodia detects visitor location to apply the correct legal framework (GDPR for EU, CCPA for California, etc.).
- **Consent receipt:** A timestamped record of a visitor's consent choices, stored for proof of compliance during audits.
