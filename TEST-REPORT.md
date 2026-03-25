# Custodia - QA Test Report

**Date:** 2026-03-25
**Tester:** qa-tester (5a453c3dbb02)
**Project:** Custodia Privacy Platform

---

## Summary

| Category | Passed | Failed | Skipped/Todo | Total |
|----------|--------|--------|-------------|-------|
| Unit Tests (Vitest) | 71 | 0 | 14 todo | 85 |
| E2E Tests (Playwright) | 18 | 0 | 1 skipped | 19 |
| **Total** | **89** | **0** | **15** | **104** |

**Result: ALL IMPLEMENTED TESTS PASS**

---

## Test Infrastructure

- **Unit/Component Testing:** Vitest 4.1.0 + React Testing Library + jsdom
- **E2E Testing:** Playwright 1.58.2 (Chromium)
- **Config files:** `vitest.config.ts`, `playwright.config.ts`
- **Test commands:** `npm test` (unit), `npx playwright test` (E2E), `npm run test:all` (both)

---

## Unit Test Results

### Library Tests

| File | Tests | Status |
|------|-------|--------|
| `lib/dsar-deadlines.test.ts` | 8 | All pass |
| `lib/public-rate-limit.test.ts` | 6 | All pass |

**dsar-deadlines:** Tests GDPR (30d), CCPA (45d), LGPD (15d), PIPEDA (30d) deadlines, unknown jurisdiction fallback, case-insensitivity, default date, and input immutability.

**public-rate-limit:** Tests first request allowed, max limit enforcement, rejection beyond limit with retryAfterSec, window expiry, independent key tracking, and correct seconds conversion.

### API Route Tests

| File | Tests | Status |
|------|-------|--------|
| `api/health.test.ts` | 3 | All pass |
| `api/signup.test.ts` | 10 | All pass |
| `api/dsar.test.ts` | 12 | All pass |
| `api/consent.test.ts` | 14 + 1 | All pass |
| `api/auth.test.ts` | 7 | All pass |
| `api/scan.test.ts` | 3 + 7 todo | Implemented pass |
| `api/policy.test.ts` | 2 + 4 todo | Implemented pass |

**health:** Validates 200/ok:true when DB is up, 503/ok:false when DB is down, ISO timestamp format.

**signup:** Tests valid user creation (201), default org creation, custom orgName, 409 for duplicate email, invited user upgrade path, 400 for invalid email/short password/missing name/empty name/long password.

**dsar (public endpoint):** Tests valid submission (201), all 6 request types, invalid JSON (400), missing fields (400), invalid email (400), non-UUID siteId (400), invalid requestType (400), site not found (404), rate limiting (429 + Retry-After header), honeypot detection (silent 201), optional fields, details max length, IP extraction for rate limit key.

**consent:** Tests consent recording (200), consent log creation, missing fields (400 x3), GDPR jurisdiction detection from cf-ipcountry, CCPA for US, null for unknown countries, x-vercel-ip-country fallback, CORS headers, webhook trigger when configured, no webhook when not configured, userAgent truncation to 500 chars, database error (500). Also tests OPTIONS preflight CORS.

**auth:** Tests credentials authorize logic: missing email/password returns null, user not found returns null, OAuth-only user (no passwordHash) returns null, wrong password returns null, valid credentials return user data.

### Component Tests

| File | Tests | Status |
|------|-------|--------|
| `app/page.test.tsx` | 2 | All pass (fixed tRPC mock) |
| `app/layout.test.tsx` | 2 | All pass |

---

## E2E Test Results

### Homepage / Landing Page (8 tests)

| Test | Status |
|------|--------|
| Homepage loads successfully | Pass |
| Main content area visible | Pass |
| Heading visible | Pass |
| Mobile responsive (375x812) | Pass |
| Hero privacy messaging | Pass |
| Navigation links visible | Pass |
| Pricing page loads | Pass |
| Pricing tiers displayed | Pass |

### Auth Flow (4 tests)

| Test | Status |
|------|--------|
| Login page with email input | Pass |
| Signup page loads | Pass |
| Dashboard redirects to login | Pass |
| Protected routes redirect to login | Pass |

### API Integration (6 tests)

| Test | Status |
|------|--------|
| Health check returns status | Pass |
| DSAR API rejects empty body | Pass |
| DSAR API rejects invalid JSON | Pass |
| DSAR API returns 404 for missing site | Pass |
| Consent API CORS on OPTIONS | Pass |
| Consent API rejects missing fields | Pass |

### Skipped (1)

| Test | Reason |
|------|--------|
| Embedded DSAR form render | Requires valid siteId in database |

---

## Bugs Found & Fixed

1. **page.test.tsx tRPC context error** — Landing page component test was failing because `Hero` and `CTA` components call `api.scan.quick.useMutation()` which requires tRPC React context. Fixed by mocking `@/lib/trpc` module.

2. **Playwright baseURL mismatch** — Playwright was configured for `localhost:3000` but production runs on `localhost:3200` via PM2. Fixed by updating to use env var with 3200 default and setting `reuseExistingServer: true`.

---

## Remaining Todo Tests (14)

These require integration test infrastructure (test database, tRPC context setup, Redis) or external service mocking (Claude API):

- Scanner: 7 tests (tRPC procedures requiring auth context + scan engine)
- Policy: 4 tests (Claude AI generation mocking)
- Auth: 3 tests (rate limiting, CSRF, session management)

---

## Test Files

```
src/__tests__/
├── setup.ts                        # Test setup (jest-dom matchers)
├── app/
│   ├── page.test.tsx               # Landing page component tests
│   └── layout.test.tsx             # Layout component tests
├── lib/
│   ├── dsar-deadlines.test.ts      # DSAR deadline calculation tests
│   └── public-rate-limit.test.ts   # Rate limiter tests
└── api/
    ├── health.test.ts              # Health endpoint tests
    ├── signup.test.ts              # Signup endpoint tests
    ├── dsar.test.ts                # Public DSAR endpoint tests
    ├── consent.test.ts             # Consent endpoint tests
    ├── auth.test.ts                # Auth credentials tests
    ├── scan.test.ts                # Scanner API tests
    └── policy.test.ts              # Policy API tests
e2e/
├── homepage.spec.ts                # Homepage + pricing E2E tests
└── scan-flow.spec.ts               # Auth flow + API integration E2E tests
```

---

## Recommendations

1. **Add integration test database** — Set up a test PostgreSQL instance to enable full tRPC router testing
2. **Mock Claude API** — Create fixtures for AI-generated content to test policy/PIA flows
3. **Add authenticated E2E tests** — Create test user seeding for dashboard, sites, DSAR management flows
4. **CI pipeline** — Add `npm run test:all` to CI with Playwright browser caching
