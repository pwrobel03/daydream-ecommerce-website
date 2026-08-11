import { expect, test } from "@playwright/test";
import { ADMIN_STATE, E2E_PRODUCT } from "./fixtures";

test.use({ storageState: ADMIN_STATE });

// Serwer dev streamuje treść spod Suspense obok wciąż obecnej powłoki, więc
// te same węzły bywają w DOM dwa razy — jedno wystąpienie ukryte.
const visible = (page: import("@playwright/test").Page, text: string) =>
  page.getByText(text).filter({ visible: true });

async function openInventory(page: import("@playwright/test").Page) {
  test.setTimeout(150_000);

  await page.goto("/dashboard/inventory");
  await expect(page.getByRole("heading", { name: "Inventory" })).toBeVisible({
    timeout: 60_000,
  });
}

// Lista przyjeżdżała z useEffect, a filtry żyły w stanie komponentu — stąd
// pusty ekran do drugiego round-tripu i wyłączona reguła lintera.
test.describe("admin inventory", () => {
  test("serves the product list in the first response", async ({ page }) => {
    await openInventory(page);

    await expect(visible(page, E2E_PRODUCT.name)).toBeVisible();

    const response = await page.request.get("/dashboard/inventory");
    expect(await response.text()).toContain(E2E_PRODUCT.name);
  });

  test("keeps the stock filter in the URL across a reload", async ({ page }) => {
    await openInventory(page);

    // Jedyny produkt w seedzie ma stan 25, więc filtr "brak na stanie" musi go
    // ukryć. Bez tego test przechodziłby przy filtrze zupełnie zignorowanym.
    await page.selectOption("select", "empty");
    await page.waitForURL(/stock=empty/, { timeout: 30_000 });

    await expect(visible(page, "The Vault is Empty")).toBeVisible();
    await expect(visible(page, E2E_PRODUCT.name)).toHaveCount(0);

    await page.reload();
    await expect(visible(page, "The Vault is Empty")).toBeVisible();
  });
});
