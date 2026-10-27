// Pages captured on every pull request that changes the UI (.github/workflows/screenshots.yml).
// To add a page, add an entry: `name` becomes the file name, `path` is opened in English.
// Seeded data comes from tests/e2e/seed.ts; use `mask` for anything that changes between runs.
import { E2E_PRODUCT } from "../e2e/fixtures";

export type Route = {
  name: string;
  path: string;
  /** Captured as the seeded demo admin instead of an anonymous visitor. */
  admin?: boolean;
  /** CSS selectors painted over before capture (dates, generated IDs). */
  mask?: string[];
};

export const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;

export const routes: Route[] = [
  { name: "home", path: "/" },
  { name: "product-list", path: "/category/all" },
  { name: "product", path: `/product/${E2E_PRODUCT.slug}`, mask: ["time"] },
  // The cart is behind sign-in, so it is captured as the demo admin.
  { name: "cart", path: "/cart", admin: true },
  { name: "search", path: "/search?q=bar" },
  { name: "sign-in", path: "/auth/login" },
  { name: "registration", path: "/auth/register" },
  { name: "forgot-password", path: "/auth/forgot-password" },
  { name: "privacy", path: "/privacy" },
  { name: "account-profile", path: "/dashboard/profile", admin: true },
  { name: "account-address", path: "/dashboard/address", admin: true },
  { name: "account-orders", path: "/dashboard/orders", admin: true, mask: ["time"] },
  { name: "admin-dashboard", path: "/dashboard", admin: true, mask: ["time"] },
  { name: "admin-analytics", path: "/dashboard/analytics", admin: true, mask: ["time"] },
  { name: "admin-inventory", path: "/dashboard/inventory", admin: true, mask: ["time"] },
  { name: "admin-orders", path: "/dashboard/manage-orders", admin: true, mask: ["time"] },
  { name: "admin-comments", path: "/dashboard/comments", admin: true, mask: ["time"] },
  { name: "admin-categories", path: "/dashboard/categories", admin: true },
  { name: "admin-ingredients", path: "/dashboard/ingredients", admin: true },
];
