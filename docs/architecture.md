# Architecture

Daydream is a full-stack ecommerce application that runs publicly as a **portfolio demo**: visitors
register, browse the catalogue, pay with a Stripe test card and explore the back-office through a
read-only demo admin account, but nothing is sold and no real money moves. Terms used here are defined in [`GLOSSARY.md`](../GLOSSARY.md); the
decisions behind this document are in [`docs/adr/`](adr/).

## Goal of the current work

Harden and clean up the existing application, then make it ready for a public deployment. In
order (see [ADR 0008](adr/0008-order-of-work-and-scope.md)):

1. CI fix, payments review and demo mode.
2. Architecture clean-up (DTO layer).
3. Deployment readiness: image, compose files, environment reference, deployment guide.

The visual redesign is a later, separate goal.

## Components

| Component | Role | Notes |
| :-- | :-- | :-- |
| **Next.js 16 app** (`app/`, `actions/`, `lib/`) | Storefront, back-office, Server Actions, route handlers | One process, standalone output, runs as non-root in Docker |
| **PostgreSQL 17** | All shop data | Accessed only through Prisma 7 (`lib/db.ts`) |
| **Redis 7** | Rate-limit and e-mail counters | Login limits fail open, e-mail limits fail closed ([ADR 0012](adr/0012-capped-outgoing-email.md)); holds nothing that needs a backup |
| **Stripe (test mode)** | Hosted Checkout and webhooks | Live keys rejected at startup ([ADR 0005](adr/0005-stripe-test-mode-only.md)) |
| **Uploads volume** (`UPLOAD_DIR`) | Images uploaded in the back-office by the private admin | Seed images ship in the image under `public/static/` |
| **Migrator** (`Dockerfile` target `migrator`) | `prisma migrate deploy`, seed, demo reset, private admin creation | One-shot container with the Prisma CLI |
| **Reservation cron** | Calls `POST /api/cron/release-reservations` every 5 minutes; the route also removes unverified registrations older than 24 hours | Bearer `CRON_SECRET` |
| **SMTP provider** | Verification, password reset and order e-mails | Chosen by the owner; capped in code ([ADR 0012](adr/0012-capped-outgoing-email.md)) |
| **Cloudflare Turnstile** | CAPTCHA on registration and password reset | Widget keys from the owner's Cloudflare account |
| **Owner scripts** (`scripts/*.sh`) | Create the private admin; demo reset with preview, dump and confirmation | Run by hand on the server ([ADR 0010](adr/0010-demo-reset.md), [ADR 0011](adr/0011-accounts-and-sign-in.md)) |
| **Reverse proxy** | TLS termination in front of the app | Chosen and run by the server administrator |

Mailpit stays in the local development stack only.

## Diagram

```text
                    visitor's browser
                           │ HTTPS
                  ┌────────▼─────────┐
                  │  reverse proxy   │  (server administrator; sets X-Real-IP)
                  └────────┬─────────┘
                           │ HTTP :3000
  ┌────────────────────────▼──────────────────────────┐
  │ Next.js app                                       │
  │  proxy.ts ── session check, locale (en / pl)      │
  │  app/[locale]/…   RSC pages, read via lib/db-*.ts │
  │                   (personal data left out for the │
  │                    demo admin)                    │
  │  actions/…        Server Actions → ActionResult<T>│
  │  lib/guards       ADMIN writes, back-office reads │
  │  lib/mail         SMTP behind the mail limits     │
  │  app/api/webhook/stripe   fulfilment              │
  │  app/api/cron/release-reservations                │
  │  app/api/health                                   │
  └───┬────────────┬─────────────┬─────────────┬──────┘
      │ Prisma     │ ioredis     │ Stripe SDK  │ SMTP, siteverify
  ┌───▼──────┐ ┌───▼───┐ ┌───────▼──────────┐ ┌▼────────────────────┐
  │PostgreSQL│ │ Redis │ │Stripe (test mode)│ │SMTP provider,       │
  └───▲──────┘ └───────┘ │Checkout · webhook│ │Cloudflare Turnstile │
      │                  └───────┬──────────┘ └─────────────────────┘
      │                          └──► POST /api/webhook/stripe
  ┌───┴──────────────────────────┐   ┌──────────────────────────┐
  │ migrator (one-shot)          │   │ cron: reservation release│
  │ migrate · seed · demo reset ·│   │ every 5 min, CRON_SECRET │
  │ create-admin (owner, by hand)│   └──────────────────────────┘
  └──────────────────────────────┘
```

## Data flow: a test purchase

1. The visitor registers (Turnstile, capped verification e-mail) and signs in
   ([ADR 0011](adr/0011-accounts-and-sign-in.md), [ADR 0012](adr/0012-capped-outgoing-email.md)).
   The cart lives in `localStorage` (Zustand) and is reconciled against the database before checkout.
2. `initializeOrder` creates a `PENDING` order with prices read from the database and reserves
   stock in one transaction; `reservedUntil` is set 45 minutes ahead.
3. `finalizeAndPay` attaches the visitor's delivery address and creates a Stripe Checkout session
   (`lib/checkout-session.ts`). The visitor pays with `4242 4242 4242 4242`.
4. Stripe calls `POST /api/webhook/stripe`. The handler verifies the signature, compares
   `amount_total` with the order total and marks the order `PAID`. Failed payments and the expiry
   of the order's current session restore stock and cancel the order; an older session expiring
   is ignored, and a payment in an older session still counts. The event is recorded in
   `ProcessedWebhookEvent` (idempotency) in the same transaction as the order change, so a failed
   attempt leaves no record and Stripe's retry is processed in full.
5. Orders that never reach payment are released by the reservation cron.
6. Paid test orders give their stock back, so they never deplete the catalogue
   ([ADR 0009](adr/0009-demo-mode-mechanics.md)). The confirmation e-mail counts against the mail
   limits; the order is fulfilled even when it is not sent.

## Layers and conventions

- **Reads** live in `lib/db-*.ts`, return data and throw on failure; the route's `error.tsx`
  renders the failure ([ADR 0004](adr/0004-reads-throw-to-the-route-boundary.md)).
  `lib/db-search.ts` is the deliberate exception.
- **Mutations** are Server Actions in `actions/<domain>/` returning `ActionResult<T>`
  ([ADR 0003](adr/0003-server-actions-return-actionresult.md)).
- **Authorization**: `proxy.ts` checks only that a session exists; `requireAdmin()` and
  `requireOwnedOrder()` in `lib/guards.ts` are the enforcing checks inside every action.
  `requireAdmin()` accepts only the private `ADMIN`; the public `DEMO_ADMIN` passes only the
  back-office read guard, and back-office reads leave out personal data for it at the query level
  ([ADR 0009](adr/0009-demo-mode-mechanics.md)).
- **Server/client boundary**: types come from the query that produced the data, not from
  hand-written interfaces ([ADR 0015](adr/0015-query-derived-view-types.md)).
- **Configuration** is validated once in `lib/env.ts`; a missing or invalid value, or any live
  Stripe key, stops the process at startup.
- **i18n**: next-intl, locales `en` and `pl`; user-facing text lives in `messages/`.

## Deployment

The deliverable is a production Docker image, `docker-compose.yml` with
`docker-compose.prod.yml`, an environment variable reference and a deployment guide in EN and PL
([ADR 0007](adr/0007-deployment-from-a-docker-image.md)). The owner deploys together with the server
administrator; nobody else has access to servers, DNS or registries.

## Personal data

Visitors' accounts, addresses and orders are real personal data. They stay until the visitor deletes
the account from the settings or the owner runs a demo reset; unverified registrations go after 24
hours. The public demo admin never receives them. Outgoing e-mail is capped in code, and backups are
kept for 7 days ([ADR 0014](adr/0014-backups.md)). What is kept, why, and who the data controller is,
is described in the privacy notice ([ADR 0013](adr/0013-privacy-notice.md)).
