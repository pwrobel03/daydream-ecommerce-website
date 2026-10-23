# 0014. Back up the deployment configuration, not the demo data

- Status: Proposed
- Date: 2026-10-23

## Context

The deployment guide must say what to back up (ADR 0007). The database is reset to the seed state every
night (ADR 0010), the seed lives in git, back-office uploads are blocked in demo mode, and Redis holds
only short-lived rate-limit counters. Visitor data should not outlive the reset (ADR 0013).

## Recommendation

Back up only what cannot be rebuilt from the repository — the server's `.env.docker` with its secrets
and any local compose or proxy configuration — and take a one-off database dump only before an upgrade,
because everything else is recreated by the seed and a routine database backup would keep visitor data
longer than the notice promises.

- `.env.docker` (Stripe test keys, webhook signing secret, `AUTH_SECRET`, `CRON_SECRET`, privacy
  controller details): stored encrypted, off the server, updated whenever a value changes.
- Before deploying a version with new migrations: `pg_dump` into a file kept until the upgrade is
  confirmed, then deleted. The guide gives the exact command and a restore procedure.
- No routine backups of the database, the uploads volume or Redis.
- TLS certificates are not backed up; they are reissued.

## Alternatives considered

- **Nightly database backups** — restore a state the next reset would discard, and keep up to a day of
  visitor Voices and IP addresses beyond the reset.
- **No backups at all** — losing `.env.docker` means re-registering the Stripe webhook and rotating every
  secret.

## Consequences

- Recovery is "rebuild from the repository, restore `.env.docker`, run migrations and the reset"; the
  guide documents it as the disaster-recovery procedure.
- If demo mode ever stops being the only configuration, this decision must be revisited.
