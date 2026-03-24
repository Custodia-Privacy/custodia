# Populating Custodia with real data

Dashboard screens read from **PostgreSQL** via **tRPC**. Main list/detail pages use real rows; a few **UI-only** elements remain (e.g. decorative “fake page” blocks inside the banner preview frame).

## Paths to data

| Path | What it creates |
|------|------------------|
| **Sign up / log in** | `users`, `organizations`, `org_members` (via signup API + NextAuth) |
| **Add Site** (UI: `/sites`) | `sites`, queued `scans` (worker must run to complete scans) |
| **New DSAR** (UI: `/dsars`) | `dsar_requests`, `dsar_activities` |
| **New assessment** (UI: `/assessments`) | `assessments` |
| **Add data store** (UI: `/data-map`) | `data_stores` |
| **Add vendor** (UI: `/vendors`) | `vendors` |
| **New preference center** (UI: `/preferences`) | `preference_centers` |
| **Run Agent** (UI: `/agents`) | `agent_runs` |
| **Settings** (UI: `/settings`) | `users.name`, `users.notification_settings` (JSON toggles) |
| **Organization & team** (UI: `/settings/organization`) | `organizations.name`, `org_members` (invite / remove / role) |
| **Setup assistant** (UI: `/assistant`) | Anthropic + org context; **Confirm** runs real mutations; rows in **`audit_logs`** via `assistant.recordConfirmedAction` |
| **Public DSAR form** (UI: `/request/<siteId>`) | `POST /api/public/dsar` → `dsar_requests` + `dsar_activities` (`actor: public_dsar_form`) |
| **Public preference center** (UI: `/preference-center/<centerId>`) | After **Publish** in `/preferences`: `preferences.getPublishedCenter`, `getPreferences` / `updatePreferences` → `user_preferences` (`source: public_center`) |
| **Site → Scans / Policy / Banner** | `scans`, `policies`, `banners` via tRPC |
| **Seed script** | One-shot demo rows for all of the above (idempotent) |
| **MCP / API** | Same routers as the UI (`/api/trpc/...`) |

## Seed script (recommended for a full demo)

1. Sign up once in the app (so your user and org exist).
2. Run:

```bash
cd custodia
SEED_USER_EMAIL=your@email.com npm run db:seed
```

The script:

- Finds your user by email.
- Creates an **organization + membership** if you somehow have no org (normally signup already did this).
- Inserts a marker site `demo-seed.custodia.local` and **skips** if that site already exists (safe to re-run).

## Scanner worker (real scans)

Adding a site enqueues a BullMQ job. You need:

- **Redis** running (`REDIS_URL` in `.env`)
- **Scanner process**: `npm run scanner:dev`

Until a scan **completes**, some fields (compliance score from latest scan, many findings) may stay empty even though the site row exists.

## Environment variables

- `SEED_USER_EMAIL` — required for `db:seed` to attach data to your account.
- `DATABASE_URL` — PostgreSQL connection (also copy to `.env` for Prisma CLI if needed).

Stripe plan env vars (optional): `STRIPE_STARTER_PRICE_ID`, `STRIPE_GROWTH_PRICE_ID`, `STRIPE_BUSINESS_PRICE_ID` (see `src/lib/stripe.ts`).

## Schema changes

After pulling Prisma schema updates, apply them to your database:

```bash
npx prisma db push
```

(or use `prisma migrate dev` if your team uses migrations).
