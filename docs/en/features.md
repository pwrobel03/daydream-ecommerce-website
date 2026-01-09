# ✨ Key Features & Business Logic

This document provides a deep dive into the core functionalities of the Daydream platform and the technical implementation of its business logic.

---

## 🛒 Shopping Cart System

The cart is managed on the client-side for maximum responsiveness but synchronized with the server logic during checkout.

- **State Management:** Powered by **Zustand**. It handles adding, removing, and updating quantities of products.
- **Persistence:** Uses Zustand's `persist` middleware to save the cart state in `localStorage`. This ensures that items remain in the cart even after a page refresh.
- **Dynamic Pricing:** Automatically calculates subtotals and totals, handling decimal precision for various currency formats.
- **Availability Check:** Before proceeding to checkout, the system verifies the `stock` levels in the database to prevent overselling.

---

## 🗣️ Product Reviews ("Voices")

The "Voices" system allows users to share their experiences and provides social proof for products.

- **CRUD Operations:** Logged-in users can create, edit, and delete their own reviews.
- **Rating System:** Supports 1-5 star ratings, which are aggregated to show the average rating on product cards.
- **Optimistic Updates:** The UI reflects review changes immediately, providing a seamless user experience.
- **Moderation:** Admins have access to a dedicated dashboard to manage and moderate all community feedback.

---

## 💳 Checkout & Payment Flow

Daydream implements a secure, production-ready payment pipeline integrated with **Stripe**.

1. **Order Initialization:** A Server Action creates a "Pending" order in the database and reserves the items.
2. **Stripe Session:** The backend generates a secure Stripe Checkout URL with line items derived from the database (not the client) to prevent price tampering.
3. **Webhook Processing:** Once the payment is successful, Stripe sends an asynchronous event to our `/api/webhook` endpoint.
4. **Order Fulfillment:** Upon receiving the webhook, the system updates the order status to "Paid", marks it for fulfillment, and clears the user's cart.

---

## 🛡️ Administrative Suite

The admin panel is a powerful tool for managing the entire store ecosystem.

- **Inventory Management:** Full CRUD for products, including multi-image uploads and assignment of categories/ingredients.
- **Order Monitoring:** A real-time dashboard to track sales, monitor delivery statuses, and manage customer information.
- **Dynamic Categories:** Admins can create and nest categories to organize the catalog effectively.
- **Ingredient Tracking:** Specialized management for product "essences" or ingredients, which are displayed as unique attributes on the storefront.

---

## 🔐 Security & Role-Based Access

The application enforces strict security boundaries using **Auth.js v5**:

- **Role Differentiation:** Users are assigned `USER` or `ADMIN` roles.
- **Server-Side Guarding:** All administrative Server Actions perform a role check before executing any database mutation.
- **Middleware Protection:** Unauthorized users are automatically redirected away from sensitive routes like `/admin` or `/checkout`.
- **Data Privacy:** Users can only access and manage their own profile data and order history.
