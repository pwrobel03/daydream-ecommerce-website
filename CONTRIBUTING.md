# Contributing to Daydream

Daydream is a full-stack ecommerce application that runs publicly as a portfolio demo: test payments
only, no real goods. The application is feature-complete; current work hardens it and prepares it for
a public deployment (see [ADR 0008](docs/adr/0008-order-of-work-and-scope.md)).

Architecture: [`docs/architecture.md`](docs/architecture.md). Terms: [`GLOSSARY.md`](GLOSSARY.md).
Decisions: [`docs/adr/`](docs/adr/).

## Stack

Next.js 16 (App Router, RSC, Server Actions, React Compiler), React 19, strict TypeScript, Tailwind CSS
v4 with shadcn/ui and Radix UI, next-intl (`en`, `pl`), Auth.js v5, PostgreSQL 17 through Prisma 7
(`@prisma/adapter-pg`), Redis 7 (ioredis), Stripe in test mode, Nodemailer with React Email, Zustand,
Zod. Tests: Vitest (unit and integration with Testcontainers) and Playwright with axe-core. Node.js
version is in [`.nvmrc`](.nvmrc); the package manager is npm.

## Getting started

```bash
npm ci
cp .env.example .env      # fill in the values; lib/env.ts validates every key at startup
npx prisma generate
npx prisma migrate deploy
npx prisma db seed        # optional, the storefront is empty without it
PORT=3100 npm run dev
```

`AUTH_URL` and `NEXT_PUBLIC_APP_URL` in `.env` must use the same port as `PORT`. The full environment
reference is in [`docs/en/environment.md`](docs/en/environment.md).

## Commands

| Purpose | Command |
| --- | --- |
| install | `npm ci` |
| Prisma client | `npx prisma generate` |
| dev server | `PORT=<port> npm run dev` |
| lint | `npm run lint` |
| typecheck | `npm run typecheck` |
| unit tests | `npm test` |
| integration tests (Docker) | `npm run test:integration` |
| E2E tests (Docker) | `npm run test:e2e` |
| build | `npm run build` |

Lint, typecheck, unit tests and build must pass before a pull request. CI also runs the integration and
E2E suites, including the WCAG A/AA accessibility specs in `tests/e2e/a11y.spec.ts`.

## Local services

- **Development:** the dev server needs PostgreSQL and Redis reachable at `DATABASE_URL` and
  `REDIS_URL`, and an SMTP server at `SMTP_HOST`/`SMTP_PORT`.
- **Whole stack in Docker:** `docker compose --env-file .env.docker up` (PostgreSQL, Redis, Mailpit, the
  migrator and the app on port 3000); see the README.
- **Integration tests:** Testcontainers starts its own PostgreSQL; only Docker is required.
- **E2E tests:** `scripts/e2e.sh` starts `docker-compose.test.yml` (PostgreSQL on 55432, Redis on 56379,
  Mailpit on 51025/58025), applies migrations, seeds `tests/e2e/seed.ts` and runs Playwright against
  `next dev` on port 3100. It removes the containers and volumes when it finishes.

## Project structure

| Path | Contents |
| --- | --- |
| `app/[locale]/` | Pages (RSC), layouts, `error.tsx` and `not-found.tsx`; `(protected)/dashboard` is the account area and the back-office |
| `app/api/` | Route handlers: Stripe webhook, reservation cron, health check, auth |
| `actions/<domain>/` | Server Actions (`admin`, `auth`, `order`, `store`, `user`) |
| `lib/db-*.ts` | Reads called from Server Components |
| `lib/` | Prisma client (`db.ts`), env validation (`env.ts`), guards, `ActionResult`, mail, rate limits, logger, uploads |
| `components/` | UI components; `components/ui/` holds shadcn/ui primitives |
| `data/` | Account and token lookups used by Auth.js |
| `schemas/` | Zod schemas for forms |
| `emails/` | React Email templates |
| `messages/` | Translations (`en.json`, `pl.json`); `i18n/` is the next-intl setup |
| `prisma/` | Schema, migrations and seed |
| `docker/`, `Dockerfile`, `docker-compose*.yml` | Image, migrator entrypoint, nginx and compose files |
| `tests/unit`, `tests/integration`, `tests/e2e` | Vitest unit, Vitest integration, Playwright |
| `docs/` | Architecture, ADRs and the setup, routing and features guides (`en`, `pl`) |
| `proxy.ts` | Session gating and locale routing (the Next.js 16 successor to `middleware.ts`) |

## Conventions

- **Mutations** are Server Actions under `actions/<domain>/` that return `ActionResult<T>` from
  `lib/action-result.ts`: `ok(data)` or `fail(code, message)`. Guards throw `ActionError`; the action
  converts it with `failFrom`. Authorization is checked inside every action, never only in a layout or
  `proxy.ts` ([ADR 0003](docs/adr/0003-server-actions-return-actionresult.md)).
- **Reads** in `lib/db-*.ts` return data and do not catch: `null` means "not found" and the page calls
  `notFound()`; failures propagate to the route's `error.tsx` and are reported through `reportError`.
  `lib/db-search.ts` is the only read that degrades to "no results"
  ([ADR 0004](docs/adr/0004-reads-throw-to-the-route-boundary.md)).
- **Types at the server/client boundary** are derived from the query that produces them: each read uses
  an explicit `select` and exports its result type; components import that type instead of hand-written
  interfaces in `types/` ([ADR 0015](docs/adr/0015-query-derived-view-types.md)).
- Server Components by default; a Client Component only where interaction needs it.
- Every user-facing string exists in both `messages/en.json` and `messages/pl.json`.
- Colours meet WCAG AA; the accessibility specs must not be weakened or given new exclusions.
- Stripe keys are test keys only; a live key stops the app at startup
  ([ADR 0005](docs/adr/0005-stripe-test-mode-only.md)).

## Decisions

- [0001. We store data in PostgreSQL through Prisma](docs/adr/0001-postgresql-with-prisma.md)
- [0002. We build on Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui and next-intl](docs/adr/0002-frameworks.md)
- [0003. Mutations are Server Actions returning ActionResult; reads return data](docs/adr/0003-server-actions-return-actionresult.md)
- [0004. Data-layer reads throw and are handled by the route's error.tsx](docs/adr/0004-reads-throw-to-the-route-boundary.md)
- [0005. Payments use Stripe in test mode only; live keys stop the app at startup](docs/adr/0005-stripe-test-mode-only.md)
- [0006. Demo mode is the only production configuration](docs/adr/0006-demo-mode-is-the-only-production-configuration.md)
- [0007. The application is deployed by the owner from a Docker image built from this repository](docs/adr/0007-deployment-from-a-docker-image.md)
- [0008. Order of work and scope of the portfolio-demo goal](docs/adr/0008-order-of-work-and-scope.md)
- [0009. The public demo admin is a read-only role, and the back-office masks personal data on the server](docs/adr/0009-demo-mode-mechanics.md)
- [0010. The demo reset is run by hand: it previews, dumps the database and waits for confirmation](docs/adr/0010-demo-reset.md)
- [0011. Visitors register their own accounts; the private admin is created by a one-off script](docs/adr/0011-accounts-and-sign-in.md)
- [0012. Outgoing e-mail works in the demo behind hard limits in code and a CAPTCHA](docs/adr/0012-capped-outgoing-email.md)
- [0013. A privacy notice page describes the visitor data the demo keeps](docs/adr/0013-privacy-notice.md)
- [0014. Back up the database and uploads daily, keep 7 days, and keep the configuration off the server](docs/adr/0014-backups.md)
- [0015. Types at the server/client boundary are derived from the queries; lib/dto becomes lib/serialize](docs/adr/0015-query-derived-view-types.md)
- [0016. The redesign gives the storefront a display face and quiets everything else](docs/adr/0016-visual-redesign.md) (proposed)

New decisions start from [`docs/adr/0000-template.md`](docs/adr/0000-template.md).

## Workflow

- One issue, one branch (`<issue number>-<short-description>`), one pull request.
- Conventional Commits (`feat: …`, `fix: …`, `docs: …`).
- Every pull request closes its issue (`Closes #N`) and lists how it was verified.

## Pitfalls

- `lib/env.ts` validates the environment when it is imported, so `next build`, the unit tests and the
  E2E server all need every variable in a valid format. Placeholder values are enough; see the `env`
  block in `.github/workflows/ci.yml`.
- `npm run typecheck` runs `next typegen` first: `tsc` alone fails on the generated route types.
  `npx prisma generate` must have run too.
- Docker Compose needs `--env-file .env.docker`; without it Compose interpolates the development `.env`
  and fails on the `$` characters in its secrets.
- `docker-compose.test.yml` has its own project name (`daydream-e2e`), so the `down -v` at the end of
  the E2E run never touches the development stack.
- The add-to-cart button is disabled until the client store has mounted and fades in over 300 ms. Its
  disabled opacity is chosen so that every frame of that fade keeps 4.5:1; lowering it fails the
  accessibility specs on the catalogue and product pages.
