# 0001. We store data in PostgreSQL through Prisma

- Status: Accepted
- Date: 2026-10-23

## Context

Daydream already runs on PostgreSQL 17 with Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`,
migrations in `prisma/migrations/`). The data is relational — users, catalogue, orders, reservations,
promotions — and stock reservation depends on transactions. A migration to Drizzle was considered and
rejected by the owner.

## Recommendation

Keep PostgreSQL with Prisma, because the schema, migrations, client extension and tests already depend
on it and a switch would buy nothing for a portfolio demo.

- Schema changes go through `prisma migrate dev` and are committed as migrations; production applies
  them with `prisma migrate deploy` in the migrator container.
- `lib/db.ts` stays the single client; its result extension converts `Decimal` money fields to `number`.
- Aggregates and `$queryRaw` bypass that extension and must convert explicitly.

## Alternatives considered

- **Drizzle** — lighter, SQL-first. Rejected by the owner; the rewrite would touch every read and
  action for no user-visible gain.
- **Another database** — nothing in the domain asks for it.

## Consequences

- The migrator image must keep the Prisma CLI and `prisma.config.ts` dependencies; the runtime image
  does not.
- Prisma 7 specifics (generated client in `lib/generated/prisma`, CommonJS output, config file) stay
  documented in `CONTRIBUTING.md`.
