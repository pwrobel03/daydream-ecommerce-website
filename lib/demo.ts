// Client-safe: no server imports. Shared by the seed, the login page, the layout and the sidebar.
export const DEMO_ADMIN_EMAIL = "demo-admin@example.com";
// Public on purpose: the account is read-only (ADR 0009).
export const DEMO_ADMIN_PASSWORD = "demo-admin-2026";

export const isBackOfficeRole = (role?: string | null) =>
  role === "ADMIN" || role === "DEMO_ADMIN";

export const isDemoAdmin = (role?: string | null) => role === "DEMO_ADMIN";
