import { expect, test } from "@playwright/test";

// The E2E environment sets no OAuth variables (playwright.config.ts).
test("login page renders without OAuth buttons or divider when no provider is configured", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByRole("button", { name: /google|github/i })).toHaveCount(0);
  await expect(page.getByText(/or continue with/i)).toHaveCount(0);
  await expect(page.getByRole("textbox").first()).toBeVisible();
});
