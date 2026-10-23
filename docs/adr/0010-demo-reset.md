# 0010. The demo reset is run by hand: it previews, dumps the database and waits for confirmation

- Status: Accepted
- Date: 2026-10-23

## Context

ADR 0006 includes a demo reset that restores the seed state. The owner's revision removes the
schedule. The owner runs the reset by hand. Before it deletes anything, the script must show what it
will delete (numbers of accounts, orders and so on), take a `pg_dump`, and wait for the owner's
explicit confirmation.

With full customer functionality (ADR 0009, 0011), the database holds real visitor accounts,
addresses and orders, so a reset now deletes personal data people chose to leave.

Facts in the code today:

- `prisma/seed.ts` purges and recreates users, catalogue, orders and reviews (`Account` rows go with
  their users by cascade). It does not clear `VerificationToken`, `PasswordResetToken`, `Sale` or
  `ProcessedWebhookEvent`. It runs as separate statements, so the shop is briefly empty while it runs.
- Seed images ship in the image under `public/static/`. `UPLOAD_DIR` holds images uploaded by the
  private admin.
- The migrator image has the Prisma CLI. `pg_dump` is in the `postgres` service.

## Recommendation

Add `scripts/demo-reset.sh`, which the owner runs in a terminal in the deployment directory, because
a host script can combine the database container (for `pg_dump`), the migrator (for the seed) and an
interactive confirmation.

1. **Preview.** `scripts/demo-reset.ts --preview` runs in the migrator and prints what will be deleted:
   customer accounts, unverified accounts, orders by status, addresses, Voices, products and
   categories added since the seed, and the files in `UPLOAD_DIR`.
2. **Dump.** `pg_dump -Fc` runs in the `postgres` container and writes
   `backups/pre-reset-<timestamp>.dump`. `UPLOAD_DIR` is archived next to it. If either step fails or
   produces an empty file, the script stops.
3. **Confirmation.** The script asks the owner to type `RESET`. Any other answer stops it. It refuses
   to run without a terminal (`[ -t 0 ]`) and has no `--yes` option, so it cannot be scheduled or piped
   by mistake.
4. **Restore.** `scripts/demo-reset.ts --apply` deletes all application data and re-inserts the seed
   state in one transaction, so visitors never see a half-reset shop. The seed data moves into a
   function that both `prisma/seed.ts` and the reset call. Then it empties `UPLOAD_DIR`.

What is kept: `ADMIN` users and their `Account` rows. The private admin is not part of the seed, and
the owner should not have to recreate it after every reset (ADR 0011). Everything else returns to
the seed state, including the demo admin.

## Alternatives considered

- **A nightly cron** (the earlier proposal) — rejected by the owner.
- **Deleting only visitor-created rows** — needs to track which rows a visitor made. The full reset is
  simpler and also undoes anything unexpected.
- **Restoring a `pg_dump` snapshot of the seed** — fast, but the snapshot has to be regenerated after
  every schema change and drifts from the seed code.
- **A confirmation flag instead of a typed answer** — easy to put into a crontab or shell history and
  run without looking at the preview.

## Consequences

- Data created between the dump and the confirmation is not in the dump. The window is as long as the
  owner takes to answer, and the preview counts are taken just before it.
- The pre-reset dump contains personal data. It is kept and deleted like any other backup (ADR 0014),
  and the privacy notice says so (ADR 0013).
- Visitors' sessions end at the reset: their users no longer exist, and the `jwt` callback already ends
  such sessions. The private admin stays signed in.
- A Stripe webhook arriving for an order the reset deleted must be acknowledged with 200 and ignored.
  The payment review (ADR 0005) verifies this.
- An integration test runs `--apply` twice against the test database and checks the seed state and
  that an `ADMIN` user survives. The shell wrapper is covered by the deployment guide's walkthrough,
  not by CI.
