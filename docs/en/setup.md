# 🛠️ Installation and Configuration Guide

This guide will walk you through the steps required to set up the Daydream ecommerce platform on your local machine.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20.x** or later
- **npm** or **yarn**
- **PostgreSQL** (Local instance or cloud-based like Supabase/Neon)
- **Stripe CLI** (Optional, for local webhook testing)

---

## ⚙️ Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone [https://github.com/pwrobel03/daydream-ecommerce-website.git](https://github.com/pwrobel03/daydream-ecommerce-website.git)
cd daydream-ecommerce-website
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory. You can use the following template based on the project requirements:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/daydream"

# Authentication (Auth.js / NextAuth)
AUTH_SECRET="your-secret-key" # Generate with: npx auth secret
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-id"
GOOGLE_CLIENT_SECRET="your-google-secret"
GITHUB_CLIENT_ID="your-github-id"
GITHUB_CLIENT_SECRET="your-github-secret"

# Stripe (Payments)
STRIPE_API_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Resend (Email Service)
RESEND_API_KEY="re_..."
```

---

## 🗄️ Database Initialization

This project uses **Prisma ORM**. Follow these commands to sync your schema and populate the database.

1. **Generate Prisma Client:**

   ```bash
   npx prisma generate
   ```

2. **Push Schema to Database:**

   ```bash
   npx prisma db push
   ```

3. **Seed Initial Data:**
   The project includes a seeding script that creates default categories, statuses, and sample products. This is essential for the initial UI preview.
   ```bash
   npx prisma db seed
   ```

---

## 💳 Stripe Webhook Testing

To handle successful payments locally, you need to forward Stripe events to your local server:

1. Log in to Stripe CLI: `stripe login`
2. Forward webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```
3. Copy the **Webhook Secret** provided by the CLI and paste it into your `.env` as `STRIPE_WEBHOOK_SECRET`.

---

## 🚀 Running the Application

Once everything is configured, start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Common Troubleshooting

- **Prisma Schema Mismatch:** If you change the `schema.prisma`, always run `npx prisma db push` followed by `npx prisma generate`.
