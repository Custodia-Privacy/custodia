# Deployment readiness (Custodia)

This document records **what was verified in-repo** and **what still requires your environment / process**. No automated run can honestly certify “100% production ready” without your staging stack, monitoring, and manual smoke tests.

## Verified in development (commands)

| Check | Command | Notes |
|--------|---------|--------|
| Production build | `npm run build` | Next.js compile + its TypeScript pass |
| CI typecheck | `npm run type-check` | Uses `tsconfig.ci.json` (excludes `.next` validator quirk) |
| Unit tests | `npm run test` / `npm run test:ci` | **4 tests pass**; **67 are `todo`** — not full coverage |
| Health probe | `GET /api/health` | Returns JSON; **503** if DB unreachable |

## Current blockers for “strict” production gates

### 1. ESLint

`npm run lint` reports **many errors** (e.g. `@typescript-eslint/no-explicit-any`, `react-hooks/set-state-in-effect`) across `src/`, `scanner/`, `mcp-server/`.

**Deploy policy (you choose):**

- **Strict:** Fix or suppress per-file with justification; lint must pass in CI.
- **Pragmatic:** Scope CI to `eslint src` only and fix incrementally; keep scanner/MCP as separate packages.

### 2. npm audit

Run `npm audit` (and `npm audit --omit=dev`). As of last check, **high** findings can appear via **Prisma → `effect`** transitive chain. Track upstream Prisma releases or `npm audit fix` **after** verifying no breakage.

### 3. Database migrations

- If you use **Prisma Migrate**, run `npx prisma migrate status` / `migrate deploy` in staging and production.
- If the DB was created with **`db push`** only, migration history may **drift** — resolve before production.

### 4. E2E tests

`npm run test:e2e` (Playwright) was **not** run as part of this audit. Run against a **running app** + test DB before go-live.

### 5. Monitoring & operations

Not defined in code: error tracking (Sentry, etc.), log aggregation, uptime checks on `/api/health`, alerts for queue/worker failures (Redis/BullMQ, scanner), Stripe webhook monitoring.

### 6. Secrets & config

- Copy `.env.example` → `.env` / platform secrets; **never** commit real keys.
- Set `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` to **production** URLs.
- `ANTHROPIC_API_KEY`, `REDIS_URL`, `RESEND_API_KEY`, Stripe keys, OAuth — all required for full functionality.

## Suggested release sequence

1. `npm ci`
2. `npx prisma generate`
3. `npx prisma migrate deploy` (or your approved migration path)
4. `npm run type-check && npm run test:ci && npm run build`
5. (Optional) `npm run lint` with your agreed scope
6. Deploy container / Node process; run **`curl -sf https://<host>/api/health`**
7. Smoke: login, create site, DSAR, billing webhook (Stripe CLI or dashboard)

## Honest summary

The app **builds** and **minimal tests pass**. **Lint, audit, E2E, migrations on your DB, and observability** must be green **in your pipeline** before calling the platform fully production-grade.
