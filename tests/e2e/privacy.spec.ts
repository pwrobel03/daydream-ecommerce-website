import { expect, test } from "@playwright/test";

test.describe("privacy notice", () => {
  test("renders in English with the controller from the environment", async ({ page }) => {
    await page.goto("/privacy");

    await expect(page.getByRole("heading", { level: 1, name: "Privacy notice" })).toBeVisible();
    await expect(page.getByText("E2E Controller Ltd")).toBeVisible();
    await expect(page.getByText("E2E SMTP Provider")).toBeVisible();
  });

  test("renders in Polish with the controller from the environment", async ({ page }) => {
    await page.goto("/pl/privacy");

    await expect(page.getByRole("heading", { level: 1, name: "Informacja o prywatności" })).toBeVisible();
    await expect(page.getByText("E2E Controller Ltd")).toBeVisible();
  });

  test("the footer link opens it", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }).click();

    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole("heading", { level: 1, name: "Privacy notice" })).toBeVisible();
  });
});
