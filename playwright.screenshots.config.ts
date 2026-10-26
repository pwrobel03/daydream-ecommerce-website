import { defineConfig } from "@playwright/test";

// Used by .github/workflows/screenshots.yml, which starts the built app itself.
const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/screenshots",
  testMatch: "**/*.spec.ts",
  workers: 1,
  reporter: "list",
  use: { baseURL: BASE_URL },
});
