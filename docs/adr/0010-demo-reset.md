# 0010. The demo reset re-runs the seed in one transaction, nightly, from the migrator image

- Status: Proposed
- Date: 2026-10-23

## Context

ADR 0006 requires a demo reset on a schedule; the owner runs it on the server, the repository provides
the script and the schedule definition. The owner's default is nightly.

`prisma/seed.ts` already purges and recreates users, catalogue, orders and reviews (`Account` rows go
with their users by cascade), but it does not clear `VerificationToken`, `PasswordResetToken`, `Sale` or
`ProcessedWebhookEvent`, and it
runs as a series of separate statements, so the storefront is briefly empty while it runs. Seed images
ship in the image under `public/static/`; `UPLOAD_DIR` holds only back-office uploads, which demo mode
blocks (ADR 0009).

## Recommendation

Add `scripts/demo-reset.ts`, run nightly at 03:00 Europe/Warsaw by a host crontab entry that starts the
migrator container, because it reuses the seed and the image that already has the Prisma CLI.

- The script truncates every application table and re-inserts the seed state inside one transaction,
  so visitors never see a half-reset shop; seed data moves into a function both `prisma/seed.ts` and
  the reset call.
- It empties `UPLOAD_DIR` (mounted into the migrator for this run) and deletes the `rl:*` rate-limit
  keys in Redis.
- It refuses to run unless `DEMO_MODE=true`, so it cannot be pointed at anything else by mistake.
- Schedule definition, documented in the deployment guide:
  `0 3 * * * cd /srv/daydream && docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm migrate npx tsx scripts/demo-reset.ts`
  (the path is the server administrator's). The same command resets by hand.
- Open sessions end at the reset: the demo accounts are recreated with new IDs, and the `jwt` callback
  already ends a session whose user no longer exists. Visitors sign in again.

## Alternatives considered

- **A compose service with a sleep loop**, like the reservation cron — keeps everything in compose, but
  a loop cannot hit a wall-clock time and drifts after restarts.
- **Restoring a `pg_dump` snapshot** — fast, but the snapshot has to be regenerated after every schema
  change and drifts from the seed code.
- **Deleting only visitor-created rows** — needs to track which rows a visitor made; the full reset is
  simpler and also undoes anything unexpected.

## Consequences

- Seeded IDs change on every reset; links to a specific order die at 03:00. Product and category slugs
  stay stable, so shared product links keep working.
- A Stripe webhook arriving for an order the reset deleted must be acknowledged with 200 and ignored;
  the payment review (ADR 0005) verifies this.
- An integration test runs the reset twice against the test database and checks the seed state.
