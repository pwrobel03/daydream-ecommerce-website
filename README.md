# Daydream Ecommerce Platform

Daydream is a full-stack ecommerce application built with **Next.js 16** and **React 19**.
It covers the complete purchase lifecycle — catalog browsing, a persistent cart, stock
reservation, Stripe payments, webhook-driven fulfilment, and an admin back-office.

---

### 🌍 Language Versions

- [English (Current)](./README.md)
- [Polski (Polish)](./README-pl.md)

---

## 🚀 Project Overview

The goal was to build an ecommerce architecture end to end rather than a catalog demo:
every mutation goes through a Server Action, authorization is enforced where it can't be
bypassed, and the payment flow reserves stock before charging.

### 🛡️ Technical highlights

- **Next.js 16 App Router & React 19** — Server Components by default, Server Actions for
  every mutation, no `getServerSideProps` anywhere.
- **Auth.js v5** — role-based access control with JWT sessions in HttpOnly cookies.
  The `jwt` callback re-reads the user on every call, so role changes and account
  deletions take effect immediately.
- **Prisma + PostgreSQL** — 12 models covering users, catalog, orders and promotions,
  with stock reservation handled inside a transaction.
- **Zod validation** — auth forms and, since `lib/env.ts`, the environment itself:
  a missing or malformed key stops the app at startup instead of surfacing as `undefined`
  mid-request.
- **Zustand** — cart state decoupled from the UI, persisted to `localStorage` and
  reconciled against the database before checkout.

---

## ✨ Features

### 🛒 Storefront

- **Catalog** — nested categories, ingredient and status attributes, paginated loading.
- **Cart** — persistent across sessions, re-synced with live prices and stock.
- **Checkout** — Stripe Checkout with stock reserved up front, plus the ability to resume
  an interrupted payment from the order history.
- **Account** — dashboard, order history, saved delivery address, and the "Voices" review
  system with per-user CRUD.

### 🛡️ Admin back-office

- **Inventory** — product CRUD with multi-image upload, filtering by search, category and
  stock state.
- **Orders** — searchable, paginated order list with status transitions.
- **Categories & ingredients** — nested category tree and product "essences".
- **Moderation** — review removal.
- **Media** — uploads converted to WebP and resized by Sharp.

---

## 🛠 Tech Stack

| Layer          | Technology                                          |
| :------------- | :-------------------------------------------------- |
| **Framework**  | Next.js 16 (App Router), React 19, TypeScript 5      |
| **Database**   | PostgreSQL, Prisma ORM                               |
| **Auth**       | Auth.js v5, bcrypt, proxy-based route gating    |
| **Payments**   | Stripe (Checkout & webhooks)                         |
| **Email**      | Resend                                               |
| **Styling**    | Tailwind CSS v4, shadcn/ui, Radix UI, tw-animate-css |
| **State**      | Zustand                                              |
| **Validation** | Zod                                                  |

---

## 📂 Documentation

1. [**Architecture & Routing**](./docs/en/routing.md) — route groups, the Server Action
   domains, and where authorization is actually enforced.
2. [**Setup Guide**](./docs/en/setup.md) — installation, environment variables, database
   seeding, Stripe webhook forwarding.
3. [**Features & Logic**](./docs/en/features.md) — checkout flow, review system, security
   model, and a list of known limitations.

---

## ⚙️ Quick Start

```bash
git clone https://github.com/pwrobel03/daydream-ecommerce-website.git
cd daydream-ecommerce-website
npm install

cp .env.example .env      # then fill in the values

npx prisma generate
npx prisma db push
npx prisma db seed        # optional, but the storefront is empty without it

npm run dev
```

See the [setup guide](./docs/en/setup.md) for the full environment reference and for
forwarding Stripe webhooks locally.

---

## 🐳 Run it with Docker

The fastest way to see the shop running, with a catalogue already in place:

```bash
cp .env.docker.example .env.docker      # placeholders are fine for a first look
docker compose --env-file .env.docker up
```

That brings up PostgreSQL, Redis and the application. On first boot the container
applies its migrations and seeds the catalogue; on later boots it detects the
existing data and leaves it alone. Open [http://localhost:3000](http://localhost:3000).

### Demo accounts

Seeded, with their email already verified:

| Role  | Email                          | Password      |
| :---- | :----------------------------- | :------------ |
| Admin | `peter@admin.com`              | `password123` |
| User  | `james.miller@daydream.com`    | `password123` |

The admin account reaches the back-office at `/dashboard/inventory`.

### What works without real API keys

The placeholder values in `.env.docker.example` are enough for the catalogue,
cart, reviews and the whole admin panel. Two things need real credentials:

- **Stripe** — checkout reaches the payment step and fails there without a test
  key. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to go further.
- **Resend** — registration cannot send its verification email. The seeded
  accounts are already verified, so signing in works regardless.

### Health and teardown

```bash
curl localhost:3000/api/health          # checks the database and Redis
docker compose --env-file .env.docker down       # stop, keep the data
docker compose --env-file .env.docker down -v    # stop and wipe the volumes
```

`--env-file` is not optional: without it Compose falls back to the development
`.env` for interpolation and trips over the `$` characters in the secrets there.

### Production

`docker-compose.prod.yml` layers nginx with TLS, certbot and the reservation
sweep on top, and stops publishing the application port directly:

```bash
docker compose --env-file .env.docker \
  -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 🚧 Project Status

Feature-complete as an application, with known gaps in hardening. The payment path has
open issues (client-supplied price snapshots, no webhook idempotency, no reservation
expiry), image uploads target the local filesystem so the app does not yet run on
serverless hosting, and there are no automated tests.

These are documented rather than hidden: see
[known limitations](./docs/en/features.md#-known-limitations) and the full analysis and
roadmap in `markdown/improvement.md`.
