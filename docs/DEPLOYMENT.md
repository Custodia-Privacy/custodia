# Deployment readiness (Custodia)

**Operational runbook (push, CI, secrets, rollback):** see **[`docs/AGENT-DEPLOYMENT.md`](./AGENT-DEPLOYMENT.md)** — that file is written for future agents and operators.

This document records **in-repo verification** and **release gates** that still depend on your environment, monitoring, and manual smoke tests.

## Verified in development (commands)

| Check | Command | Notes |
|--------|---------|-------|
| Production build | `npm run build` | Next.js compile + its TypeScript pass |
| CI typecheck | `npm run type-check` | Uses `tsconfig.ci.json` (excludes `.next` validator quirk) |
| Unit tests | `npm run test` / `npm run test:ci` | Run under **Node 22** to match `.github/workflows/deploy.yml`; some tests may be `todo` |
| Health probe | `GET /api/health` | Returns JSON; **503** if DB unreachable |

## Current blockers for “strict” production gates

### 1. ESLint

`npm run lint` may report **warnings** (e.g. `@typescript-eslint/no-explicit-any`) across `src/`, `scanner/`, `mcp-server/`. The deploy workflow treats lint as **must pass** with the default ESLint exit policy for warnings — confirm repo policy before widening rules.

**Deploy policy (you choose):**

- **Strict:** Fix or suppress per-file with justification; lint must pass in CI.
- **Pragmatic:** Scope CI to `eslint src` only and fix incrementally; keep scanner/MCP as separate packages.

### 2. npm audit

Run `npm audit` (and `npm audit --omit=dev`). As of last check, **high** findings can appear via **Prisma → `effect`** transitive chain. Track upstream Prisma releases or `npm audit fix` **after** verifying no breakage.

### 3. Database migrations

- **Production:** `docker-entrypoint.sh` runs `prisma migrate deploy` on app container start.
- If the DB was created with **`db push`** only, migration history may **drift** — resolve before production.

### 4. E2E tests

`npm run test:e2e` (Playwright) is **not** part of the default deploy workflow. Run against a **running app** + test DB before high-risk releases.

### 5. Monitoring & operations

Not defined solely in code: error tracking (Sentry, etc.), log aggregation, uptime checks on `/api/health`, alerts for queue/worker failures (Redis/BullMQ, scanner), Stripe webhook monitoring.

### 6. Secrets & config

- **Never** commit real keys. Use `.env.example` only for placeholders. Canonical production files live on the host under **`~/.custodia/`** (see `docs/AGENT-DEPLOYMENT.md`).
- Set `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` to **production** HTTPS origins in `.env.docker` (or equivalent).
- Stripe, OAuth, Anthropic, Resend, Redis, DB URLs — required for full functionality; rotate via host secrets, not git.

## Suggested release sequence

1. `npm ci`
2. `npx prisma generate --schema prisma/schema.prisma`
3. `npx prisma migrate deploy --schema prisma/schema.prisma` (or your approved migration path on the target DB)
4. `npm run type-check && npm run test:ci && npm run build`
5. (Optional) `npm run lint` with your agreed scope
6. Push `main` (or manual compose on host per agent runbook)
7. `curl -sf https://<public-host>/api/health`
8. Smoke: login, create site, DSAR, billing webhook (Stripe CLI or dashboard)

## Honest summary

The app **builds** and **tests run in CI on Node 22**. **Lint policy, audit, E2E, migrations on your DB, and observability** must be green **in your pipeline** before calling the platform fully production-grade.
