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

1. **`initializeOrder`** — in one transaction reads prices from the database (the active
   sale's coupon is applied from the database too), reserves stock with a conditional
   update, and creates a `PENDING` order with an `OrderItem` price snapshot. A line is
   capped at 10 units.
2. **`finalizeAndPay`** — saves the delivery address, links it to the order and the user
   profile, creates a Stripe Checkout session (30 minute expiry) and stores
   `stripeSessionId` on the order.
3. **`POST /api/webhook/stripe`** — verifies the Stripe signature, then on
   `checkout.session.completed` marks the order `PAID`, and on
   `checkout.session.expired` / `payment_intent.payment_failed` returns the reserved stock
   and cancels the order. Every event id is recorded, so a re-delivery is ignored;
   `amount_total` must match the order, otherwise it stays unpaid, while a payment in an older
   session of the order is accepted;
   live-mode events and events for orders that no longer exist are acknowledged with 200
   and ignored. A paid test order puts its stock back, since no goods ship. A declined card
   cancels the order, and a successful retry in the same Checkout session still ends
   `PAID` with the stock unchanged. Only the expiry of the order's current session cancels it;
   an older session expiring is ignored.
4. **`recreateStripeSession`** — issues a fresh payment session for a `PENDING`, unpaid
   order from `/dashboard/orders/[orderId]`, so an interrupted payment can be resumed. It
   charges the same total as the first attempt, discount included.

Orders not paid within 45 minutes are cancelled and their stock returned by
`POST /api/cron/release-reservations`; it shares one conditional update with the webhook, so
stock comes back once even when both hit the same order.

**Test mode only.** Stripe keys must be test keys (a live key stops the app at startup), live
sessions and events are refused, and the checkout and payment screens, and the Stripe page,
show the test card `4242 4242 4242 4242` (any future expiry, any CVC). A declined card
is `4000 0000 0000 0002`. See [ADR 0005](../adr/0005-stripe-test-mode-only.md).

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

| Area | Limitation |
| :--- | :--- |
| **Image storage** | Uploads are written to `UPLOAD_DIR` on the local filesystem. This works in development and on a host with a persistent disk, but not on serverless hosting, where the filesystem is read-only and ephemeral. |
