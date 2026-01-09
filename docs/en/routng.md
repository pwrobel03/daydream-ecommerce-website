# 📂 Project Architecture & Routing

This document details the routing system and the modular organization of business logic in the Daydream platform. The project follows the **Next.js 15 App Router** patterns with a domain-driven approach for Server Actions.

---

## 🏗️ Route Groups & Layouts

We use **Route Groups** to handle different application contexts and layouts without affecting the URL structure.

| Group         | Path Purpose        | Layout Details                                       |
| :------------ | :------------------ | :--------------------------------------------------- |
| `(root)`      | General Storefront  | Global Navbar, Footer, and persistent Cart sidebar.  |
| `(auth)`      | Identity Management | Minimalist centered layout for authentication forms. |
| `(admin)`     | Back-office         | Sidebar-based navigation, restricted to Admin users. |
| `(protected)` | User Account        | Layout for orders and profile management.            |

---

## ⚡ Server Actions: Domain-Driven Logic

The core logic is located in `@/actions`. We have refactored the initial "flat" structure into **Domain Folders** to ensure scalability and maintainability.

### 📦 Action Domains

#### 🛡️ Admin Domain (`@/actions/admin/`)

Restricted logic for store management.

- `inventory.ts` – Product CRUD and stock management.
- `categories.ts` – Category hierarchy and attribute management.
- `ingredients.ts` – Management of product essences/ingredients.
- `orders.ts` – Global order tracking and fulfillment.
- `reviews.ts` – Administrative moderation of user feedback.

#### 🔐 Auth Domain (`@/actions/auth/`)

Core identity flow using Auth.js.

- `login.ts` / `logout.ts` – Session management.
- `register.ts` – User onboarding.
- `password-reset.ts` – Combined logic for reset requests and new password setting.
- `verify-email.ts` – Token-based email confirmation.

#### 🛒 Store Domain (`@/actions/store/`)

Customer-facing interactions.

- `reviews.ts` – Consolidated logic for creating, fetching, and managing product reviews (Voices).
- `checkout.ts` – Initialization of Stripe sessions and pre-payment validation.
- `cart.ts` – Server-side cart synchronization.

#### 👤 User Domain (`@/actions/user/`)

Personal data management.

- `address.ts` – Shipping and billing info management.
- `settings.ts` – Profile and account preference updates.

---

## 🗺️ Application Map

### 🌐 Public Access

- `/` – Landing page with featured collections.
- `/category/[categoryName]` – Main catalog with multi-criteria filtering.
- `/product/[slug]` – Dynamic product pages with related reviews.

### 🔐 Protected Access

- `/dashboard` – Unified user profile and order history.
- `/checkout` – Secure payment tunnel (Stripe integration).
- `/dashboard/(admin)/*` – Entire management suite (Admin only).

---

## 🛡️ Security & Middleware

The `middleware.ts` acts as a centralized gatekeeper for the application:

1. **RBAC Validation:** Prevents non-admin users from accessing paths within the `(admin)` group.
2. **Session Persistence:** Ensures Auth.js sessions are valid for protected routes.
3. **Route Whitelisting:** Defines public routes (Shop, Home) to ensure they remain accessible for SEO and guests.

---

## 🔗 External Callbacks (API)

Standard API routes are reserved for external integrations:

- `POST /api/webhook` – **Stripe Webhook**: Processes asynchronous payment events to finalize orders and update database records.
