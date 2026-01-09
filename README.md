# Daydream Ecommerce Platform

Daydream is a premium, full-stack ecommerce solution built with **Next.js 15**. It represents a modern approach to web development, focusing on type safety, server-side logic with React Server Components, and a robust security model.

---

### 🌍 Language Versions
- [English (Current)](./README.md)
- [Polski (Polish)](./README-pl.md)

---

## 🚀 Project Overview

The goal of this project was to create a production-ready ecommerce architecture. It handles the entire lifecycle of a purchase—from dynamic product discovery and persistent cart management to secure Stripe payments and automated order fulfillment.

### 🛡️ Technical Excellence & Security
* **Next.js 15 & React 19:** Utilizing the newest features like asynchronous request APIs and Server Actions for all data mutations.
* **Authentication (Auth.js v5):** Implemented Role-Based Access Control (RBAC). Sessions are managed via encrypted JWTs stored in secure, HttpOnly cookies to prevent XSS attacks.
* **Data Integrity:** Strict schema validation using **Prisma ORM** and **Zod**. Database operations are protected by server-side session checks to ensure that only authorized users (Admins) can modify the inventory.
* **State Management:** Decoupled cart logic using **Zustand** with a custom persistence layer to synchronize the shopping experience across browser sessions.

---

## ✨ Key Features

### 🛒 Client-Facing Logic
- **Advanced Product Catalog:** Dynamic fetching with category and attribute filtering.
- **Smart Cart:** Global state management with automatic local storage synchronization.
- **Secure Checkout:** Integrated **Stripe** payment gateway with server-side validation of stock and prices before session creation.
- **User Ecosystem:** Personalized dashboards, order history, and a "Voice" system for product reviews.

### 🛡️ Administrative Suite
- **Full Inventory Control:** Comprehensive CRUD interface for products, categories, and product essences.
- **Order Management:** Real-time tracking of transaction statuses and delivery coordination.
- **Media Pipeline:** Automatic image optimization via **Sharp** and hosting on **Cloudinary**.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router), TypeScript 5 |
| **Database** | PostgreSQL, Prisma ORM |
| **Security** | Auth.js v5, Bcrypt, Middleware protection |
| **Payments** | Stripe (API & Webhooks) |
| **Styling** | Tailwind CSS, Shadcn UI, Framer Motion |

---

## 📂 Modular Documentation

For a deeper dive into specific parts of the system, please refer to:
1.  [**Architecture & Routing**](./docs/en/routing.md) - Explaining the `@/app` structure and Server Actions.
2.  [**Setup Guide**](./docs/en/setup.md) - Step-by-step installation and environment configuration.
3.  [**Features & Logic**](./docs/en/features.md) - Detailed breakdown of the checkout flow and auth logic.

---

## ⚙️ Quick Start

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/pwrobel03/daydream-ecommerce-website.git](https://github.com/pwrobel03/daydream-ecommerce-website.git)
    cd daydream-ecommerce-website
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Database Setup:**
    Configure your `.env` file, then run:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

4.  **Seed the Database (Optional but Recommended):**
    Populate your database with initial products, categories, and essences to see the app in action immediately:
    ```bash
    npx prisma db seed
    ```

5.  **Run Development Server:**
    ```bash
    npm run dev
    ```
