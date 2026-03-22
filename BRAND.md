# Custodia Brand Guide

## Brand Name

**Custodia** — from Latin *custodia* meaning "guardianship, protection, custody." Conveys the idea of safeguarding data with authority and care. Serious enough for compliance, approachable enough for small business.

## Logo Concept

**Primary Mark:** A stylized shield formed from two overlapping abstract shapes — one representing data (a flowing curve) and one representing protection (a geometric edge). The negative space between them creates a subtle "C." The shield is not a literal heraldic shield — it's modern, minimal, with rounded geometry.

**Wordmark:** "Custodia" set in Inter Display (600 weight), letterspaced at +0.02em. The "C" is slightly enlarged as a visual anchor. All lowercase feels too casual for compliance; title case conveys authority.

**Icon/Favicon:** The shield mark alone, rendered in the primary indigo (#4338ca) on white, or white on indigo. At 16px, simplifies to a single geometric shield shape.

**Logo Lockup:**
- Horizontal: Icon + wordmark, 12px gap at standard size
- Stacked: Icon above wordmark, centered

**Clear Space:** Minimum clear space = height of the "C" in the wordmark on all sides.

**Logo Don'ts:**
- Never rotate or skew
- Never use unapproved colors
- Never place on busy backgrounds without a container
- Minimum size: 24px height for icon, 80px width for full lockup

## Color Palette

### Primary
| Name | Hex | Usage |
|------|-----|-------|
| Indigo 900 | `#1e1b4b` | Page backgrounds (dark), deep accents |
| Indigo 700 | `#4338ca` | Primary brand color, CTAs, links |
| Indigo 500 | `#6366f1` | Hover states, secondary buttons |
| Indigo 100 | `#e0e7ff` | Light tints, badges, subtle backgrounds |

### Neutral (Slate)
| Name | Hex | Usage |
|------|-----|-------|
| Slate 950 | `#020617` | Dark mode backgrounds |
| Slate 900 | `#0f172a` | Dark mode surfaces |
| Slate 800 | `#1e293b` | Dark mode cards |
| Slate 700 | `#334155` | Borders (dark) |
| Slate 400 | `#94a3b8` | Muted text |
| Slate 200 | `#e2e8f0` | Borders (light) |
| Slate 100 | `#f1f5f9` | Light backgrounds, cards |
| Slate 50 | `#f8fafc` | Page background (light) |

### Semantic
| Name | Hex | Usage |
|------|-----|-------|
| Emerald 500 | `#10b981` | Compliant, success, secure |
| Emerald 100 | `#d1fae5` | Success backgrounds |
| Amber 500 | `#f59e0b` | Warnings, attention needed |
| Amber 100 | `#fef3c7` | Warning backgrounds |
| Red 500 | `#ef4444` | Violations, errors, critical |
| Red 100 | `#fee2e2` | Error backgrounds |

## Typography

### Font Stack
- **Display/Headings:** Inter Display (or Inter at 600-700 weight), with `font-feature-settings: 'cv01', 'cv02', 'cv11'` for the sharper alternate glyphs
- **Body:** Inter, 400-500 weight
- **Mono/Code:** JetBrains Mono (for scan results, code snippets, tracker IDs)

### Type Scale
| Level | Size | Weight | Line Height | Letter Spacing |
|-------|------|--------|-------------|----------------|
| Display | 48-64px | 700 | 1.1 | -0.02em |
| H1 | 36-40px | 700 | 1.2 | -0.02em |
| H2 | 28-30px | 600 | 1.25 | -0.01em |
| H3 | 22-24px | 600 | 1.3 | -0.01em |
| H4 | 18-20px | 600 | 1.4 | 0 |
| Body Large | 18px | 400 | 1.6 | 0 |
| Body | 16px | 400 | 1.6 | 0 |
| Body Small | 14px | 400 | 1.5 | 0 |
| Caption | 12px | 500 | 1.4 | 0.01em |

## Tone of Voice

### Personality Attributes
1. **Expert but approachable** — We know compliance deeply, but we don't talk down to people. Plain English first, legal terms second (always explained).
2. **Calm and confident** — Privacy compliance is stressful. We are the steady hand. No alarmist language, no scare tactics. We make it manageable.
3. **Direct and efficient** — Small business owners don't have time. Get to the point. Lead with what they need to do, not background.
4. **Empowering** — The user should feel smarter after using Custodia, not more dependent. We explain *why*, not just *what*.

### Writing Guidelines

**Do:**
- Use "you" and "your" — speak directly to the reader
- Lead with the benefit, not the feature
- Explain compliance concepts in plain language, then parenthetically reference the regulation
- Use active voice: "Custodia scans your site" not "Your site is scanned by Custodia"
- Be specific: "Found 14 trackers across 3 vendors" not "We found some issues"

**Don't:**
- Use fear-based messaging ("You could be fined millions!")
- Use unexplained jargon (DPIA, DPO, data controller — always define on first use)
- Sound robotic or overly corporate
- Use exclamation marks excessively
- Promise absolute legal compliance (we're a tool, not legal counsel)

### Example Copy

**Hero:** "Privacy compliance for businesses that can't afford a legal team. AI-powered. Actually affordable."

**Feature intro:** "Your AI privacy team. Custodia scans your website, finds every tracker, and builds your compliance stack automatically. No privacy expertise required."

**CTA:** "Scan your website free" / "See what's tracking your visitors"

**Compliance status:** "Your site is 87% compliant with GDPR. Here are the 3 items to fix." (not "WARNING: GDPR VIOLATIONS DETECTED")

**Error/issue:** "We found a tracker that isn't listed in your cookie policy. We can update the policy for you, or you can remove the tracker." (not "VIOLATION: Undisclosed tracker detected!")

## Visual Direction

### Aesthetic
Linear meets Stripe. Clean, spacious, purposeful. Every element earns its place. The design should communicate:
- **Trust** through consistency, alignment, and restraint
- **Competence** through data visualization and clear information hierarchy
- **Modernity** through subtle gradients, glass effects, and smooth animations

### Key Visual Elements
- **Cards with subtle borders** — not heavy shadows. 1px border in slate-200 (light) or slate-700 (dark), with slight rounded corners (8-12px)
- **Gradient accents** — Indigo-to-violet gradients for hero sections and CTAs, used sparingly
- **Data visualization** — Clean, minimal charts. Green/amber/red compliance gauges. No chartjunk
- **Iconography** — Lucide icons (consistent with the Next.js ecosystem). 24px default, 1.5px stroke
- **Illustrations** — Abstract, geometric. Shield motifs. Data flow diagrams as visual elements. No cartoon people
- **Motion** — Subtle, purposeful. Fade-in on scroll. Number counters for scan results. No bouncing or spinning

### Dark Mode
- Not an afterthought. Dark mode is the *default* for the dashboard (privacy professionals work in dark mode)
- Landing page defaults to light with dark mode toggle
- Dark mode uses slate-950 background, slate-900 surfaces, slate-800 cards
- Primary indigo stays the same — it works on both

### Layout Principles
- Max content width: 1280px
- Generous whitespace. Section padding: 80-120px vertical on landing page
- 12-column grid, 24px gutters
- Mobile-first responsive breakpoints: 640px, 768px, 1024px, 1280px

## Brand Applications

### Website
- Clean white (or dark) backgrounds
- Hero with subtle radial gradient behind headline
- Feature sections alternate between full-width and contained
- Pricing table is a centerpiece — clear, honest, no hidden fees

### Product Dashboard
- Left sidebar navigation (collapsible)
- Top bar with site selector and notification bell
- Main content area with card-based layout
- Status indicators use the semantic color system consistently

### Email Communications
- Minimal template, Inter font stack with system fallbacks
- Indigo header bar with Custodia wordmark
- Plain text-forward design, not HTML-heavy
- Clear single CTA per email
