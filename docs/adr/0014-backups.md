# 0014. Back up the database and uploads daily, keep 7 days, and keep the configuration off the server

- Status: Accepted
- Date: 2026-10-23

## Context

The deployment guide must say what to back up (ADR 0007). After the owner's revision, the database is
no longer reset on a schedule (ADR 0010). It holds visitor accounts, addresses and orders, which only
the visitor (ADR 0011) or a manual reset deletes. Back-office uploads by the private admin live in the
uploads volume. Redis holds only short-lived counters. Backups keep personal data, so their retention
has to be stated in the privacy notice (ADR 0013).

## Recommendation

Take a daily `pg_dump` and a daily archive of the uploads volume, keep 7 of each, and keep one
encrypted copy off the server, because that is the smallest scheme that survives the loss of the
server and still lets deleted data expire within a week.

- **Database:** `pg_dump -Fc` from the `postgres` container, once a day, into a backup directory
  outside the compose project, readable only by its owner. The guide gives the crontab line for the
  server administrator and the rotation, which deletes dumps older than 7 days.
- **Uploads:** a `tar` of the uploads volume, on the same schedule and with the same retention.
- **Off-server copy:** the newest dump and archive, encrypted before they leave the server
  (e.g. `age` or `gpg`), with the same 7-day retention at the destination. The administrator chooses
  the destination.
- **Configuration:** the server's `.env.docker` (Stripe test keys, webhook signing secret,
  `AUTH_SECRET`, `CRON_SECRET`, SMTP and Turnstile credentials, privacy details) and any local proxy
  config are stored encrypted off the server and updated whenever a value changes.
- **Pre-reset and pre-upgrade dumps** (ADR 0010, and one before deploying new migrations) follow the
  same 7-day retention.
- **Not backed up:** Redis (counters only) and TLS certificates (reissued).
- **Restore:** the guide documents the restore of a dump and an archive into a fresh deployment. The
  owner tests it once at deployment.

## Alternatives considered

- **Configuration only, no database backups** (the earlier proposal) — it assumed a nightly reset.
  Now a lost server would lose every visitor account.
- **Longer retention (30 days)** — safer against unnoticed corruption, but an account deleted by its
  owner would survive in backups for a month, and the notice would have to say so.
- **Managed or continuous backups (WAL archiving)** — a finer recovery point for a demo that does not
  need one, and more for the administrator to run.

## Consequences

- An account deleted by its owner persists in backups for up to 7 days. The privacy notice says so.
- Restoring a backup brings back accounts deleted after it was taken. The guide limits restores to
  disaster recovery and warns about this. Tracking deletions to replay them after a restore is not
  proposed; with a 7-day window, it is not worth the extra state.
- The backup commands are documented, not shipped as services. Running them is the server
  administrator's job, like the reverse proxy.
