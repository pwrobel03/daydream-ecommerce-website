# 📂 Project Architecture & Routing

This document describes the routing system and the modular organization of business
logic in the Daydream platform. The project follows **Next.js 16 App Router** patterns
with a domain-driven layout for Server Actions.

---

## 🏗️ Route Groups & Layouts

Route Groups (folders in parentheses) organize the application without affecting URLs.

| Group         | Purpose         | Layout                                                                     |
| :------------ | :-------------- | :------------------------------------------------------------------------- |
| `(protected)` | Signed-in area  | No layout of its own — grouping only. Access is enforced by `middleware.ts`. |
| `(admin)`     | Back-office     | `dashboard/(admin)/layout.tsx` checks the role server-side and renders `NotAllowedView` for non-admins. |

The storefront and the auth pages are **not** in route groups — they live directly under
`app/` (`app/page.tsx`, `app/category/`, `app/product/`, `app/auth/`). The shared shell
(header, footer) comes from the root `app/layout.tsx`; `app/auth/layout.tsx` provides the
centered layout for identity forms, and `dashboard/layout.tsx` adds the sidebar shared by
all signed-in users.

---

## ⚡ Server Actions: domain-driven logic

Business logic lives in `@/actions`, split into domain folders.

### 🛡️ Admin domain (`@/actions/admin/`)

| File             | Exports                                                    |
| :--------------- | :--------------------------------------------------------- |
| `inventory.ts`   | `getInventoryProducts`, `upsertProduct`, `deleteProduct`     |
| `categories.ts`  | `createCategory`, `getCategories`, `deleteCategory`          |
| `ingredients.ts` | `upsertIngredient`, `deleteIngredient`                       |
| `orders.ts`      | `getAdminOrders`, `updateOrderStatus`                        |
| `reviews.ts`     | `getVoices`, `deleteVoice`                                   |

Every export in this domain calls `requireAdmin()` from `@/lib/guards`, which throws when
the session role is not `ADMIN`. The guard throws rather than returning an error so a call
site cannot ignore the result and continue.

### 🔐 Auth domain (`@/actions/auth/`)

| File                | Exports                     |
| :------------------ | :-------------------------- |
| `login.ts`          | `login`                     |
| `register.ts`       | `register`                  |
| `reset-password.ts` | `resetPassword`, `newPassword` |
| `verify-email.ts`   | `newVerification`           |

Sign-out is handled by Auth.js directly through `signOut()` — there is no logout action.

### 🛒 Store domain (`@/actions/store/`)

| File            | Exports                                                        |
| :-------------- | :-------------------------------------------------------------- |
| `reviews.ts`    | `createReview`, `updateReview`, `deleteReview`, `getMoreReviews` |
| `sync-cart.ts`  | `getFreshCartData`                                               |

### 📦 Order domain (`@/actions/order/`)

| File       | Exports                                                                              |
| :--------- | :------------------------------------------------------------------------------------ |
| `order.ts` | `initializeOrder`, `finalizeOrderAddress`, `finalizeAndPay`, `recreateStripeSession`   |

Checkout is not a separate module — order creation, address capture and Stripe session
creation all live here.

### 👤 User domain (`@/actions/user/`)

| File          | Exports            |
| :------------ | :----------------- |
| `address.ts`  | `saveUserAddress`  |
| `settings.ts` | `settings`         |

---

## 🗺️ Application map

### 🌐 Public

| Route              | Page                          |
| :----------------- | :---------------------------- |
| `/`                | Landing page                  |
| `/category/[slug]` | Catalog, `all` shows everything |
| `/product/[slug]`  | Product detail with reviews    |
| `/auth/*`          | login, register, forgot-password, new-password, new-verification, error |

### 🔐 Signed in

| Route                          | Page                          |
| :----------------------------- | :---------------------------- |
| `/cart`                        | Cart summary                  |
| `/cart/delivery/[orderId]`     | Delivery address, starts payment |
| `/order/success/[orderId]`     | Post-payment confirmation     |
| `/dashboard`                   | Account overview              |
| `/dashboard/profile`           | Profile and password          |
| `/dashboard/address`           | Default shipping address      |
| `/dashboard/orders`            | Order history                 |
| `/dashboard/orders/[orderId]`  | Order detail, retry payment   |

There is no `/checkout` route — checkout runs through `/cart` → `/cart/delivery/[orderId]`.

### 🛡️ Admin only

| Route                             | Page                     |
| :-------------------------------- | :----------------------- |
| `/dashboard/inventory`            | Product list             |
| `/dashboard/inventory/[productId]` | Product form (`new` creates) |
| `/dashboard/ingredients`          | Ingredient list          |
| `/dashboard/ingredients/[id]`     | Ingredient form          |
| `/dashboard/categories`           | Category tree            |
| `/dashboard/manage-orders`        | All orders, status changes |
| `/dashboard/comments`             | Review moderation        |

---

## 🛡️ Security layers

Authorization is enforced at two distinct layers — `middleware.ts` alone is **not** what
protects the admin area.

**1. `middleware.ts` — authentication only.** It checks whether a session exists and
redirects anonymous visitors to `/auth/login`. Public routes are whitelisted in
`routes.ts` (`publicRoutes`, `authRoutes`, `apiAuthPrefix`). The middleware performs no
role checking at all.

**2. `dashboard/(admin)/layout.tsx` — authorization.** Reads the role server-side via
`getCurrentRole()` and renders `NotAllowedView` when it is not `ADMIN`.

**3. Server Actions — the layer that actually matters.** Every admin action calls
`requireAdmin()` independently. Server Actions are publicly reachable POST endpoints, so
neither middleware nor a layout can protect them; the check must live in the action.

---

## 🔗 External callbacks (API)

| Route                        | Purpose                                                        |
| :--------------------------- | :------------------------------------------------------------- |
| `POST /api/webhook/stripe`   | Stripe events: `checkout.session.completed` marks the order paid; `checkout.session.expired` and `payment_intent.payment_failed` restore stock and cancel the order. |
| `/api/auth/[...nextauth]`    | Auth.js handlers                                                |

When forwarding events locally, point the Stripe CLI at the full path:

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```
