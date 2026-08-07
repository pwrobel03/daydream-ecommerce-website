# ✨ Key Features & Business Logic

A walk through the core functionality of the Daydream platform and how it is implemented.

---

## 🛒 Shopping cart

The cart lives entirely on the client and is reconciled with the database at checkout.

- **State:** Zustand store in `store.ts`, persisted to `localStorage` under `cart-store`.
- **Server sync:** `getFreshCartData` (`actions/store/sync-cart.ts`) re-reads price, promo
  price and stock for the products in the cart, so a stale `localStorage` entry does not
  drive the UI.
- **Pricing:** `getTotalPrice` prefers `promoPrice` over `price`; `getSubTotalPrice`
  always uses the base price, which is what the strike-through total is built from.
- **Stock:** verified inside the `initializeOrder` transaction before the order is created.

---

## 🗣️ Product reviews ("Voices")

- **CRUD:** signed-in users create, edit and delete their own reviews
  (`actions/store/reviews.ts`).
- **Ratings:** 1–5 stars, aggregated into the average shown on product cards.
- **Pagination:** `getMoreReviews` loads reviews in pages; the product page shows the
  current user's own review first, then up to nine others.
- **Moderation:** admins list and remove any review from `/dashboard/comments`.

---

## 💳 Checkout & payment

The flow spans two pages and four Server Actions.

1. **`initializeOrder`** — opens a transaction, validates stock for every item, decrements
   it, and creates a `PENDING` order with an `OrderItem` price snapshot.
2. **`finalizeAndPay`** — saves the delivery address, links it to the order and the user
   profile, creates a Stripe Checkout session (30 minute expiry) and stores
   `stripeSessionId` on the order.
3. **`POST /api/webhook/stripe`** — verifies the Stripe signature, then on
   `checkout.session.completed` marks the order `PAID`, and on
   `checkout.session.expired` / `payment_intent.payment_failed` returns the reserved stock
   and cancels the order.
4. **`recreateStripeSession`** — issues a fresh payment session for a `PENDING`, unpaid
   order from `/dashboard/orders/[orderId]`, so an interrupted payment can be resumed.

---

## 🛡️ Administrative suite

- **Inventory:** product CRUD with multi-image upload, category and ingredient assignment,
  and filtering by search term, category and stock state (`all` / `low` / `empty`).
- **Orders:** all orders with search and pagination, plus status transitions across
  `PENDING → PAID → SHIPPED → DELIVERED → CANCELLED`.
- **Categories:** flat and nested categories via a self-relation on `Category.parentId`.
- **Ingredients:** product "essences", shown as attributes on the storefront.
- **Media:** uploads are converted to WebP and resized to fit 1200×1200 by Sharp before
  being written to disk.

---

## 🔐 Security & role-based access

- **Roles:** `USER` and `ADMIN` on the `User` model.
- **Sessions:** JWT strategy. The `jwt` callback re-reads the user from the database on
  every call, so a role change or account deletion takes effect immediately.
- **Server Actions:** each admin action calls `requireAdmin()` from `@/lib/guards`, which
  throws. This is the layer that matters — Server Actions are publicly reachable POST
  endpoints, so middleware and layouts cannot protect them.
- **Passwords:** bcrypt, cost factor 12.
- **Email verification:** credentials sign-in is refused until `emailVerified` is set.
  Changing the email address clears it and re-sends a verification link.
- **Environment:** every variable is validated by `lib/env.ts` at startup, so a missing or
  malformed key fails fast instead of surfacing as `undefined` mid-request.

---

## ⚠️ Known limitations

Documented deliberately — these are real gaps in the current implementation, tracked in
`markdown/improvement.md`.

| Area | Limitation |
| :--- | :--- |
| **Order pricing** | `initializeOrder` takes the `OrderItem` price snapshot from the client payload rather than the database, so the Stripe line items are derived from client-controlled input. |
| **Stripe transaction** | The Checkout session is created inside a Prisma interactive transaction, which risks a rollback after the session already exists. |
| **Webhook** | No idempotency key, so a Stripe retry on `checkout.session.expired` can restock an order more than once. The paid amount is not compared against the order total. |
| **Stock reservations** | Stock is decremented at `initializeOrder`, but nothing releases it if the customer abandons checkout before a Stripe session is ever created. |
| **Image storage** | Uploads are written to `public/` on the local filesystem. This works in development and on a VPS with a persistent disk, but not on serverless hosting, where the filesystem is read-only and ephemeral. |
| **Transactional email** | `sendVerificationEmail` and `sendPasswordResetEmail` ignore their `to` argument and send to the fixed `MAILING_ACCOUNT` address — a workaround for Resend sandbox mode, which requires a verified sending domain to lift. |
| **Validation** | Zod covers the auth forms. `initializeOrder`, `finalizeAndPay` and `upsertProduct` still accept unvalidated input. |
| **Rate limiting** | None on the auth actions. |
| **Tests** | None. |
