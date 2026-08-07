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

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/daydream"

# Auth.js — generate the secret with: npx auth secret
AUTH_SECRET="your_auth_secret_here"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"

# OAuth providers.
# Auth.js v5 discovers these by name — the keys are not passed explicitly in
# auth.config.ts, so the AUTH_<PROVIDER>_ID / _SECRET spelling is required.
AUTH_GOOGLE_ID="your_google_client_id"
AUTH_GOOGLE_SECRET="your_google_client_secret"
AUTH_GITHUB_ID="your_github_client_id"
AUTH_GITHUB_SECRET="your_github_client_secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Resend
RESEND_API_KEY="re_..."
MAILING_ACCOUNT_PROVIDER="onboarding@resend.dev"
MAILING_ACCOUNT="your_verified_inbox@example.com"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Note on email.** Until you verify a sending domain in Resend, both transactional
> emails are delivered to `MAILING_ACCOUNT` regardless of the recipient. Set it to an
> inbox you control, otherwise email verification links will be unreachable.

---

## 🗄️ Database

The project uses **Prisma ORM**.

1. **Generate the client:**

   ```bash
   npx prisma generate
   ```

2. **Push the schema:**

   ```bash
   npx prisma db push
   ```

3. **Seed:**
   Creates categories, statuses, ingredients, products, users, reviews and sample orders.
   Recommended — without it the storefront renders empty.

   ```bash
   npx prisma db seed
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

To sign in as an administrator, set the role directly in the database — there is no
self-service promotion:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

---

## 🛠️ Troubleshooting

- **App exits on start with a list of environment variables** — that is `lib/env.ts`
  doing its job. The message names each offending key.
- **Schema changes not visible** — re-run `npx prisma db push` followed by
  `npx prisma generate`.
- **Stale route type errors after deleting a page** — remove the `.next` directory and
  re-run the type check.
- **`npm run lint` fails with `compat is not defined`** — the ESLint flat config is
  currently broken; see `markdown/improvement.md`.
