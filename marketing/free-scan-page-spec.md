# Free Scan Landing Page — Implementation Spec

## Purpose
A dedicated `/scan` page (URL: https://app.custodia-privacy.com/scan) targeting high-intent SEO queries:
- "free website privacy scanner"
- "GDPR scanner free"
- "website compliance checker"
- "cookie scanner online"
- "CCPA compliance checker"

This gives the scanner a direct, shareable URL — easier to link to from communities, newsletters, and blog posts than the homepage.

## Route
`src/app/(marketing)/scan/page.tsx`

## Page Title / Meta
```
title: "Free Website Privacy Scanner — Find GDPR & CCPA Issues"
description: "Scan any website for privacy compliance issues in 60 seconds. Find hidden trackers, consent gaps, and policy problems — free, no signup required."
```

## Layout

The page should feel like a focused tool, not a marketing page.

### Hero (above fold)
- Small badge: "Free · No signup required"
- H1: "Website Privacy Scanner"
- Subtext: "Find every tracker, consent issue, and policy gap on any website — in under 60 seconds."
- The scan form (URL input + "Scan" button) — same logic as the hero component
- After scan: results displayed in the same format as the hero

### "What we scan" section (below fold)
Simple 3-column grid with icons:
- **Cookies & Trackers** — Identifies every cookie and tracking script, including third-party analytics, ad pixels, and session recorders
- **Consent Compliance** — Checks whether your cookie banner loads scripts before consent and whether it respects Global Privacy Control (GPC) signals
- **Privacy Policy Gaps** — Flags missing disclosures and mismatches between your policy and what's actually running on your site

### "How it works" section
3 numbered steps:
1. Enter your URL — paste any website URL and click Scan
2. Get your report — see every tracker, cookie, and compliance issue found
3. Fix it with Custodia — sign up to set up your consent banner, generate your privacy policy, and automate DSARs

### CTA section
"Ready to fix what we found?"
"Sign up free → get weekly monitoring, auto-generated policies, and a compliance dashboard."
[Get Started Free] button → /signup

## Implementation Notes

- Reuse the `api.scan.quick` tRPC mutation and `api.scan.quickResult` query (same as hero.tsx)
- Reuse the `FindingRow` component pattern from hero.tsx — but define it locally or extract to a shared file
- The scan results section should be identical in behavior to the hero
- After scan completes: show results + email capture ("Get this report by email" using the existing `/api/public/blog-subscribe` endpoint)
- Add the slug to sitemap.ts static pages (priority 0.8, changeFrequency 'weekly')

## Why This Matters
The homepage bundles the scanner with marketing. A dedicated /scan URL:
1. Gets indexed separately for scanner-specific queries
2. Is shareable ("here, scan your site: custodia-privacy.com/scan")
3. Can be linked from every blog post as the tool destination
4. Gives a focused UX for users who just want to scan

Update all blog post CTAs to use `/scan` instead of the homepage root.
