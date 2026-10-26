# 🛠️ Installation and Configuration Guide

How to get the Daydream platform running locally.

---

## 📋 Prerequisites

- **Node.js 20.x** or later
- **npm**
- **PostgreSQL** — a local instance or a hosted one (Neon, Supabase)
- **Stripe CLI** — optional, needed to test webhooks locally

---

## ⚙️ Setup

### 1. Clone the repository

```bash
git clone https://github.com/pwrobel03/daydream-ecommerce-website.git
cd daydream-ecommerce-website
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Copy `.env.example` to `.env` and fill in the values. Every key is validated at startup by
`lib/env.ts`, so a missing or malformed value stops the app with a message naming the
offending variable rather than failing later at runtime.

Every variable, its format, an example, its default and where to get the value are in the
[environment variable reference](./environment.md). Stripe keys must be test keys, and `AUTH_URL`
and `NEXT_PUBLIC_APP_URL` must match the public URL; the reference states these rules.

---

## 🗄️ Database

The project uses **Prisma ORM**.

1. **Generate the client:**

   ```bash
   npx prisma generate
   ```

2. **Apply the migrations:**

   ```bash
   npx prisma migrate deploy
   ```

3. **Seed:**
   Creates categories, statuses, ingredients, products, users, reviews and sample orders.
   Recommended — without it the storefront renders empty.

   ```bash
   npx tsx --env-file=.env prisma/seed.ts
   ```

---

## 💳 Stripe webhooks

To finalize payments locally, forward Stripe events to your dev server. Note the full
path — the handler lives at `/api/webhook/stripe`, not `/api/webhook`:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

Copy the `whsec_...` secret the CLI prints into `STRIPE_WEBHOOK_SECRET`.

Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

---

## 🚀 Running

```bash
npm run dev
```

Available at [http://localhost:3000](http://localhost:3000).

To sign in as an administrator, create the private admin with the script — there is no
self-service promotion. It asks for the password (at least 12 characters) on standard input;
creating it again for the same e-mail resets the password:

```bash
printf '%s\n' 'a-password-of-12+-chars' | npx tsx --env-file=.env scripts/create-admin.ts you@example.com "Your Name"
```

On a Docker deployment use `scripts/create-admin.sh <email> [name]` instead; see the
[deployment guide](./deployment.md).

---

## 🛠️ Troubleshooting

- **App exits on start with a list of environment variables** — that is `lib/env.ts`
  doing its job. The message names each offending key.
- **Schema changes not visible** — run `npx prisma migrate deploy` followed by
  `npx prisma generate`.
- **Stale route type errors after deleting a page** — remove the `.next` directory and
  re-run the type check.

## 📸 Screenshots on pull requests

A pull request that touches the UI gets one comment with before/after screenshots
(`.github/workflows/screenshots.yml`). The workflow builds and seeds the PR head and the base
branch the same way (`tests/e2e/seed.ts`), captures every page at 1440×900 and 390×844 in English,
and compares them pixel by pixel. It is information for the reviewer, not a gate.

To add a page, add an entry to `tests/screenshots/routes.ts`:

```ts
{ name: "privacy", path: "/privacy" },
{ name: "admin-inventory", path: "/dashboard/inventory", admin: true, mask: ["time"] },
```

- `name` becomes the file name and the label in the comment.
- `path` is opened in English; the seed data must contain whatever the page shows.
- `admin: true` captures it as the seeded demo admin.
- `mask` lists CSS selectors painted over before the capture: use it for dates and generated IDs,
  so two runs of the same commit give identical files.

Run it locally against a running, seeded app: `SCREENSHOT_BASE_URL=http://localhost:3100 npm run screenshots`
(files go to `screenshots-out/`, or `SCREENSHOT_DIR`).
