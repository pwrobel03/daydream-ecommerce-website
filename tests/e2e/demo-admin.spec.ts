import { expect, test } from "@playwright/test";
import { DEMO_ADMIN_EMAIL, E2E_PRODUCT } from "./fixtures";

test("the demo admin opens the inventory but cannot delete", async ({ page }) => {
  test.setTimeout(150_000);

  await page.goto("/auth/login");
  await expect(page.getByText(DEMO_ADMIN_EMAIL).first()).toBeVisible();
  await page.getByRole("button", { name: "Sign in as demo admin" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });

  await page.goto("/dashboard/inventory");
  await expect(page.getByRole("heading", { name: "Inventory" })).toBeVisible({ timeout: 60_000 });

  const remove = page.getByRole("button", { name: `Delete ${E2E_PRODUCT.name}` }).filter({ visible: true });
  await expect(remove).toBeDisabled();

  await page.goto("/dashboard/manage-orders");
  await expect(page.getByRole("heading", { name: /Access Denied/ })).toBeVisible({ timeout: 60_000 });
});
