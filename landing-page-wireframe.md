# Custodia Landing Page Wireframe

## Page Structure

```
[Nav]
[Hero]
[Social Proof Bar]
[Scanner Demo]
[Features Grid]
[How It Works]
[Dashboard Preview]
[Pricing]
[Comparison Table]
[Testimonials]
[FAQ]
[Final CTA]
[Footer]
```

---

## 1. Navigation Bar

**Fixed top, blur backdrop, z-50**

```
┌─────────────────────────────────────────────────────────────────┐
│  [Shield Icon] Custodia          Features  Pricing  FAQ    [Scan Your Site Free →]  │
└─────────────────────────────────────────────────────────────────┘
```

- Logo + wordmark left-aligned
- Nav links: Features, Pricing, FAQ (smooth scroll anchors)
- CTA button: "Scan Your Site Free" — primary style, right-aligned
- Background: white/95 with backdrop-blur (dark: neutral-950/90)
- Border-bottom: 1px neutral-200
- Mobile: hamburger menu, full-screen overlay nav

---

## 2. Hero Section

**Centered layout, generous vertical padding (120px top, 80px bottom)**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              Privacy compliance for businesses                  │
│            that can't afford a legal team.                      │
│            AI-powered. Actually affordable.                     │
│                                                                 │
│         Your AI privacy team scans your website, finds          │
│       every tracker, and builds your compliance stack           │
│                      automatically.                             │
│                                                                 │
│     ┌──────────────────────────────────────────────┐            │
│     │  Enter your website URL    [Scan Free →]     │            │
│     └──────────────────────────────────────────────┘            │
│            No credit card required · Results in 60 seconds      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- H1: Display size (48-64px), font-bold, tracking-tighter, max-width 800px
- Subtitle: text-lg, neutral-600, max-width 600px
- Input group: large URL input + primary button, visually prominent
- Subtext: text-sm, neutral-400
- Background: subtle radial gradient (indigo-950/5 → transparent) behind headline
- Optional: faint grid pattern or dot matrix in background

---

## 3. Social Proof Bar

**Subtle, trust-building. Light gray background strip.**

```
┌─────────────────────────────────────────────────────────────────┐
│  Trusted by 2,000+ businesses  ·  GDPR  ·  CCPA  ·  CPRA  ·  VCDPA  │
│  [SOC2 badge]  [GDPR badge]  [CCPA badge]                      │
└─────────────────────────────────────────────────────────────────┘
```

- Regulation logos/badges in grayscale
- Counter: "X websites scanned" (animated count-up)
- Background: neutral-100 (dark: neutral-900)
- Padding: 24px vertical

---

## 4. Scanner Demo Section

**Full-width, dark background. The "wow" moment.**

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─ See it in action ──────────────────────────────────────┐    │
│  │                                                          │    │
│  │  ┌─ Browser Frame ────────────────────────────────────┐  │    │
│  │  │  example.com                                        │  │    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │  │    │
│  │  │  │ Google   │ │ Facebook │ │ HotJar   │           │  │    │
│  │  │  │ Analytics│ │ Pixel    │ │ Heatmaps │           │  │    │
│  │  │  │ 🟡 warn  │ │ 🔴 viol  │ │ 🟡 warn  │           │  │    │
│  │  │  └──────────┘ └──────────┘ └──────────┘           │  │    │
│  │  └────────────────────────────────────────────────────┘  │    │
│  │                                                          │    │
│  │  Found: 14 trackers · 3 vendors · 2 violations          │    │
│  │  [View Full Report →]                                    │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

- Animated simulation of a scan running: progress bar, trackers appearing one by one
- Cards pop in as trackers are "discovered" — color-coded by severity
- Summary line animates in after scan completes
- Background: neutral-950 with subtle indigo glow
- This section is key for conversion — make it feel magical

---

## 5. Features Grid

**8 features in a 2x4 grid (desktop), stacked on mobile**

```
┌─────────────────────────────────────────────────────────────────┐
│                  Everything you need.                            │
│              Nothing you don't.                                  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │ [Scan icon]      │  │ [Shield icon]    │                      │
│  │ Website Scanner  │  │ Consent Manager  │                      │
│  │ AI finds every   │  │ Smart banners    │                      │
│  │ tracker on your  │  │ based on actual  │                      │
│  │ site.            │  │ scan results.    │                      │
│  └─────────────────┘  └─────────────────┘                      │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │ [FileText icon]  │  │ [Clipboard icon] │                      │
│  │ Policy Generator │  │ Privacy Impact   │                      │
│  │ AI writes your   │  │ AI-guided        │                      │
│  │ privacy policy   │  │ assessments.     │                      │
│  │ from scan data.  │  │                  │                      │
│  └─────────────────┘  └─────────────────┘                      │
│                  ... (4 more feature cards)                      │
└─────────────────────────────────────────────────────────────────┘
```

- Section heading: H2, centered
- Cards: icon (indigo-500, 32px), title (H4, font-semibold), description (text-sm, neutral-600)
- Card style: bordered, slight hover elevation
- Grid: 2 cols mobile, 4 cols desktop
- Animate in on scroll, staggered

---

## 6. How It Works

**3-step horizontal flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                     How it works                                 │
│                                                                 │
│    ┌──────────┐      ┌──────────┐      ┌──────────┐           │
│    │    1     │──────│    2     │──────│    3     │           │
│    │  Scan    │      │  Build   │      │  Stay    │           │
│    │  your    │      │  your    │      │  compli- │           │
│    │  site    │      │  stack   │      │  ant     │           │
│    └──────────┘      └──────────┘      └──────────┘           │
│                                                                 │
│    Enter your URL.    AI generates       Weekly re-scans        │
│    AI crawls every    consent banner,    monitor for new        │
│    page and finds     privacy policy,    trackers. Get          │
│    all trackers.      and compliance     alerted when           │
│                       dashboard.         things change.         │
│                                                                 │
│              [Scan Your Website Free →]                          │
└─────────────────────────────────────────────────────────────────┘
```

- Three columns with numbered circles (indigo-700 bg, white text)
- Connecting line/arrow between steps (dashed, neutral-300)
- Each step: number, title (H3), description (body text)
- CTA button at bottom, centered

---

## 7. Dashboard Preview

**Product screenshot/mockup section**

```
┌─────────────────────────────────────────────────────────────────┐
│          Your compliance command center                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ┌─────┐  ┌──────────────────────────────────────────┐   │  │
│  │  │ Nav │  │  Dashboard with compliance gauges,       │   │  │
│  │  │     │  │  tracker list, regulation status         │   │  │
│  │  │     │  │                                          │   │  │
│  │  │     │  │  [Mockup image / screenshot]             │   │  │
│  │  └─────┘  └──────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Dark background (neutral-950)
- Dashboard screenshot in a browser frame with macOS-style window controls
- Slight perspective transform (rotateX 2deg) for depth
- Subtle shadow and glow around the frame

---

## 8. Pricing Section

**4 tiers, horizontal cards**

```
┌─────────────────────────────────────────────────────────────────┐
│              Simple, transparent pricing                         │
│         No hidden fees. Cancel anytime.                          │
│                                                                 │
│  ┌────────┐ ┌────────┐ ┌─────────────┐ ┌────────┐             │
│  │ Free   │ │Starter │ │  Growth     │ │Business│             │
│  │        │ │        │ │  POPULAR    │ │        │             │
│  │ $0     │ │ $29/mo │ │  $79/mo     │ │$149/mo │             │
│  │        │ │        │ │             │ │        │             │
│  │ 1 scan │ │ 1 site │ │  3 sites    │ │10 sites│             │
│  │ Report │ │ Banner │ │  + DSAR     │ │+ API   │             │
│  │        │ │ Policy │ │  + PIA      │ │+ Gov   │             │
│  │        │ │ Dashbd │ │  + Prefs    │ │+ Brand │             │
│  │        │ │ Weekly │ │             │ │        │             │
│  │        │ │        │ │             │ │        │             │
│  │[Start] │ │[Start] │ │ [Start]     │ │[Start] │             │
│  └────────┘ └────────┘ └─────────────┘ └────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

- Growth tier highlighted: indigo border, "Most Popular" badge
- Each tier: name, price, feature list with check icons, CTA button
- Free tier CTA: "Scan Free"
- Paid tier CTAs: "Start Free Trial" (14-day)
- Annual toggle with "Save 20%" badge
- Neutral background (white/neutral-50)

---

## 9. Comparison Table

**Horizontal scroll on mobile**

```
┌──────────────────────────────────────────────────────────────────┐
│                  Why Custodia?                                    │
│                                                                  │
│              │ Custodia │ CookieBot │ OneTrust  │ Transcend     │
│  ────────────┼──────────┼───────────┼───────────┼────────────── │
│  AI Scanner  │    ✓     │    ✗      │    ✓      │    ✓          │
│  Consent     │    ✓     │    ✓      │    ✓      │    ✓          │
│  Policies    │    ✓     │    ~      │    ✗      │    ✗          │
│  DSAR        │    ✓     │    ✗      │    ✓      │    ✓          │
│  PIA/DPIA    │    ✓     │    ✗      │    ✓      │    ✓          │
│  Price       │  $29-149 │  $12-45   │  $5,000+  │  $10,000+    │
│  Setup time  │  5 min   │  15 min   │  Weeks    │  Weeks       │
│  For SMBs    │    ✓     │    ✓      │    ✗      │    ✗          │
│  ────────────┼──────────┼───────────┼───────────┼────────────── │
└──────────────────────────────────────────────────────────────────┘
```

- Custodia column highlighted (indigo-50 background)
- Checkmarks in emerald, X marks in red, tildes in amber
- Clean table styling, bordered cells

---

## 10. Testimonials

**3 cards in a row**

```
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐  │
│  │ "Custodia saved │ │ "I was spending │ │ "We manage 8    │  │
│  │  me $5k/year    │ │  hours on GDPR  │ │  client sites.  │  │
│  │  vs OneTrust."  │ │  compliance.    │ │  Custodia makes │  │
│  │                 │ │  Now it's auto."│ │  it so easy."   │  │
│  │  — Sarah K.     │ │  — Marcus T.    │ │  — Alyssa R.    │  │
│  │  SaaS Founder   │ │  E-commerce     │ │  Web Agency     │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

- Quote, attribution, role/company
- Avatar placeholder (initials in colored circle)
- Card style with subtle border
- Star ratings (5 stars, amber-400)

---

## 11. FAQ Section

**Accordion style**

```
┌─────────────────────────────────────────────────────────────────┐
│                  Frequently asked questions                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ▸ Is this legally binding?                               │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ▸ Do I really need privacy compliance?                   │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ▸ What regulations apply to my business?                 │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ▸ How is this different from just a cookie banner?       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ▸ Can I use this if I'm not in the EU?                   │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ ▸ What happens if my site changes?                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

- Expandable accordions with smooth height transition
- Chevron icon rotates on open
- Max-width 768px, centered
- Answers in body text, neutral-600

---

## 12. Final CTA Section

**Full-width, indigo gradient background**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│         Ready to get compliant in 5 minutes?                    │
│                                                                 │
│     ┌──────────────────────────────────────────────┐           │
│     │  Enter your website URL    [Scan Free →]     │           │
│     └──────────────────────────────────────────────┘           │
│         Join 2,000+ businesses · No credit card required        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Background: gradient from indigo-950 to indigo-900
- White text
- Same URL input component as hero
- Social proof line below

---

## 13. Footer

```
┌─────────────────────────────────────────────────────────────────┐
│  [Shield] Custodia          Product     Company    Legal        │
│                              Features   About      Privacy     │
│  AI-powered privacy          Pricing    Blog       Terms       │
│  compliance for              Docs       Careers    Cookies     │
│  modern businesses.          API        Contact    GDPR        │
│                              Changelog             CCPA        │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  © 2026 Custodia Privacy, Inc.    [Twitter] [LinkedIn] [GitHub] │
└─────────────────────────────────────────────────────────────────┘
```

- 4-column layout: brand, product, company, legal
- Subtle border-top separator
- Copyright + social icons at bottom
- Background: neutral-950, text neutral-400

---

## Responsive Behavior

| Section | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Nav | Full links + CTA | Hamburger | Hamburger |
| Hero | Centered, 64px heading | 48px heading | 36px heading, tighter padding |
| Features | 4-col grid | 2-col | 1-col stack |
| How It Works | 3-col horizontal | 3-col | 1-col vertical |
| Pricing | 4-col | 2x2 grid | 1-col stack, horizontal scroll option |
| Comparison | Full table | Horizontal scroll | Horizontal scroll |
| Testimonials | 3-col | 2-col + 1 | 1-col carousel |
| Footer | 4-col | 2x2 | 1-col stack |
