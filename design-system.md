# Custodia Design System

## Design Tokens

### Color Palette

#### Primary — Indigo
```
--color-primary-50:  #eef2ff
--color-primary-100: #e0e7ff
--color-primary-200: #c7d2fe
--color-primary-300: #a5b4fc
--color-primary-400: #818cf8
--color-primary-500: #6366f1
--color-primary-600: #4f46e5
--color-primary-700: #4338ca
--color-primary-800: #3730a3
--color-primary-900: #312e81
--color-primary-950: #1e1b4b
```

#### Neutral — Slate
```
--color-neutral-50:  #f8fafc
--color-neutral-100: #f1f5f9
--color-neutral-200: #e2e8f0
--color-neutral-300: #cbd5e1
--color-neutral-400: #94a3b8
--color-neutral-500: #64748b
--color-neutral-600: #475569
--color-neutral-700: #334155
--color-neutral-800: #1e293b
--color-neutral-900: #0f172a
--color-neutral-950: #020617
```

#### Success — Emerald
```
--color-success-50:  #ecfdf5
--color-success-100: #d1fae5
--color-success-200: #a7f3d0
--color-success-400: #34d399
--color-success-500: #10b981
--color-success-600: #059669
--color-success-700: #047857
```

#### Warning — Amber
```
--color-warning-50:  #fffbeb
--color-warning-100: #fef3c7
--color-warning-200: #fde68a
--color-warning-400: #fbbf24
--color-warning-500: #f59e0b
--color-warning-600: #d97706
--color-warning-700: #b45309
```

#### Danger — Red
```
--color-danger-50:  #fef2f2
--color-danger-100: #fee2e2
--color-danger-200: #fecaca
--color-danger-400: #f87171
--color-danger-500: #ef4444
--color-danger-600: #dc2626
--color-danger-700: #b91c1c
```

### Typography

#### Font Families
```
--font-sans:    'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
--font-display: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
--font-mono:    'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace
```

#### Font Sizes
```
--text-xs:      0.75rem    /* 12px */
--text-sm:      0.875rem   /* 14px */
--text-base:    1rem       /* 16px */
--text-lg:      1.125rem   /* 18px */
--text-xl:      1.25rem    /* 20px */
--text-2xl:     1.5rem     /* 24px */
--text-3xl:     1.875rem   /* 30px */
--text-4xl:     2.25rem    /* 36px */
--text-5xl:     3rem       /* 48px */
--text-6xl:     3.75rem    /* 60px */
```

#### Font Weights
```
--font-normal:    400
--font-medium:    500
--font-semibold:  600
--font-bold:      700
```

#### Line Heights
```
--leading-none:    1
--leading-tight:   1.1
--leading-snug:    1.25
--leading-normal:  1.5
--leading-relaxed: 1.6
```

#### Letter Spacing
```
--tracking-tighter: -0.02em
--tracking-tight:   -0.01em
--tracking-normal:  0
--tracking-wide:    0.01em
```

### Spacing Scale
```
--space-0:   0
--space-0.5: 0.125rem  /* 2px */
--space-1:   0.25rem   /* 4px */
--space-1.5: 0.375rem  /* 6px */
--space-2:   0.5rem    /* 8px */
--space-3:   0.75rem   /* 12px */
--space-4:   1rem      /* 16px */
--space-5:   1.25rem   /* 20px */
--space-6:   1.5rem    /* 24px */
--space-8:   2rem      /* 32px */
--space-10:  2.5rem    /* 40px */
--space-12:  3rem      /* 48px */
--space-16:  4rem      /* 64px */
--space-20:  5rem      /* 80px */
--space-24:  6rem      /* 96px */
--space-32:  8rem      /* 128px */
```

### Border Radius
```
--radius-sm:   0.375rem  /* 6px */
--radius-md:   0.5rem    /* 8px */
--radius-lg:   0.75rem   /* 12px */
--radius-xl:   1rem      /* 16px */
--radius-2xl:  1.5rem    /* 24px */
--radius-full: 9999px
```

### Shadows
```
--shadow-xs:  0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow-sm:  0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
--shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
--shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
--shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)
```

### Transitions
```
--transition-fast:   150ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-base:   200ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow:   300ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

---

## Layout

### Container
- Max width: 1280px
- Padding: 24px (mobile), 32px (tablet), 0 (desktop, centered)

### Grid
- 12 columns
- Gap: 24px (--space-6)
- Breakpoints:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px
  - `2xl`: 1536px

### Section Spacing (Landing Page)
- Vertical padding: 80px (`--space-20`) mobile, 96-120px desktop
- Between-section gap: 0 (padding handles it)

---

## Component Specifications

### Buttons

#### Primary
```
background: var(--color-primary-700)     /* #4338ca */
color: white
padding: 10px 20px                       /* --space-2.5 --space-5 */
border-radius: var(--radius-lg)          /* 8px - not too round */
font-weight: var(--font-semibold)
font-size: var(--text-sm)
transition: var(--transition-base)
hover:background: var(--color-primary-600)
```

#### Secondary
```
background: transparent
color: var(--color-primary-700)
border: 1px solid var(--color-primary-200)
padding: 10px 20px
border-radius: var(--radius-lg)
hover:background: var(--color-primary-50)
```

#### Ghost
```
background: transparent
color: var(--color-neutral-600)
padding: 10px 20px
border-radius: var(--radius-lg)
hover:background: var(--color-neutral-100)
```

#### Sizes
| Size | Padding | Font Size | Height |
|------|---------|-----------|--------|
| sm | 6px 12px | 13px | 32px |
| md | 10px 20px | 14px | 40px |
| lg | 12px 24px | 16px | 48px |
| xl | 16px 32px | 18px | 56px |

### Cards
```
background: white                        /* dark: var(--color-neutral-800) */
border: 1px solid var(--color-neutral-200) /* dark: var(--color-neutral-700) */
border-radius: var(--radius-lg)
padding: var(--space-6)
```

### Badges / Status Pills
```
Compliant:  bg emerald-100, text emerald-700, border emerald-200
Warning:    bg amber-100, text amber-700, border amber-200
Violation:  bg red-100, text red-700, border red-200
Neutral:    bg slate-100, text slate-600, border slate-200
```
```
padding: 2px 10px
border-radius: var(--radius-full)
font-size: var(--text-xs)
font-weight: var(--font-medium)
```

### Input Fields
```
background: white                        /* dark: var(--color-neutral-900) */
border: 1px solid var(--color-neutral-300) /* dark: var(--color-neutral-600) */
border-radius: var(--radius-md)
padding: 10px 14px
font-size: var(--text-sm)
focus:border-color: var(--color-primary-500)
focus:ring: 0 0 0 3px var(--color-primary-100)
```

### Navigation (Dashboard Sidebar)
```
width: 260px (expanded), 64px (collapsed)
background: var(--color-neutral-950)     /* always dark */
item-padding: 8px 12px
item-border-radius: var(--radius-md)
active-item-bg: var(--color-neutral-800)
active-item-text: white
inactive-item-text: var(--color-neutral-400)
hover-item-bg: var(--color-neutral-900)
```

### Compliance Gauge
- Circular progress ring, 120px diameter
- Track: var(--color-neutral-200) / dark: var(--color-neutral-700)
- Fill color based on score:
  - 80-100%: emerald-500
  - 50-79%: amber-500
  - 0-49%: red-500
- Center: score percentage in text-2xl font-bold

---

## Iconography

- **Library:** Lucide React (`lucide-react`)
- **Default size:** 20px (in UI), 24px (in feature cards)
- **Stroke width:** 1.5px
- **Color:** Inherits from parent text color

### Key Icons by Feature
| Feature | Icon |
|---------|------|
| Scanner | `Scan`, `Search` |
| Consent | `ShieldCheck`, `ToggleLeft` |
| Policies | `FileText`, `Scale` |
| PIA/DPIA | `ClipboardCheck`, `AlertTriangle` |
| DSAR | `UserCheck`, `Send` |
| Data Governance | `Database`, `GitBranch` |
| Dashboard | `LayoutDashboard`, `BarChart3` |
| Preferences | `Settings`, `Bell` |
| Compliant | `CheckCircle2` |
| Warning | `AlertCircle` |
| Violation | `XCircle` |

---

## Dark Mode Strategy

All components use CSS custom properties mapped through Tailwind's `dark:` variant:

| Token | Light | Dark |
|-------|-------|------|
| Page bg | neutral-50 | neutral-950 |
| Surface | white | neutral-900 |
| Card | white | neutral-800 |
| Border | neutral-200 | neutral-700 |
| Text primary | neutral-900 | neutral-50 |
| Text secondary | neutral-600 | neutral-400 |
| Text muted | neutral-400 | neutral-500 |

Primary, success, warning, and danger colors remain the same in both modes.

---

## Animation Guidelines

### Page Transitions
- Fade in: opacity 0→1, translateY 8px→0, 300ms ease-out
- Stagger children by 50ms

### Micro-interactions
- Button press: scale(0.98), 100ms
- Toggle switch: translateX, 200ms spring
- Tooltip: opacity + scale(0.95→1), 150ms

### Data Loading
- Skeleton screens with shimmer gradient animation (neutral-200 → neutral-100 → neutral-200)
- Scan progress: animated progress bar with subtle pulse

### Scroll Animations (Landing Page)
- Intersection Observer triggered
- Elements fade in + translate up 20px
- 400ms duration, staggered by 100ms per element
- Only animate once (no re-triggering on scroll back)
