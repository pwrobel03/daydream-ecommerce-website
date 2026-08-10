import { expect, test } from "@playwright/test";
import { E2E_PRODUCT } from "./seed";

test.describe("product search", () => {
  test("finds a product by name and links to it", async ({ page }) => {
    await page.goto(`/search?q=${encodeURIComponent("Test Bar")}`);

    const link = page.getByRole("link", { name: new RegExp(E2E_PRODUCT.name, "i") });
    await expect(link.first()).toBeVisible();

    await link.first().click();
    await page.waitForURL(new RegExp(`/product/${E2E_PRODUCT.slug}`));
  });

  test("matches a prefix, so suggestions work while typing", async ({ page }) => {
    // "Test Bar" powinno trafić już po "Tes".
    await page.goto("/search?q=Tes");

    await expect(page.getByText(new RegExp(E2E_PRODUCT.name, "i")).first()).toBeVisible();
  });

  test("tolerates a typo through the trigram fallback", async ({ page }) => {
    await page.goto("/search?q=Tets%20Bar");

    await expect(page.getByText(new RegExp(E2E_PRODUCT.name, "i")).first()).toBeVisible();
  });

  test("reports no matches without breaking the page", async ({ page }) => {
    await page.goto("/search?q=zzzzqqqq");

    await expect(page.getByText(/nothing matches/i).first()).toBeVisible();
  });

  test("is reachable without a session", async ({ request }) => {
    const response = await request.get("/search?q=bar", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });
});
