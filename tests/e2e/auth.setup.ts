import { test as setup, expect } from "@playwright/test";
import { ADMIN_STATE, E2E_ADMIN } from "./fixtures";

// Logowanie jest limitowane (5 prób na e-mail i IP w 15 minut), a każdy spec
// panelu logował się osobno — przy szóstym teście limiter zaczynał odrzucać
// i test padał na logowaniu, nie na tym, co sprawdzał. Jedna sesja zapisana
// raz i współdzielona rozwiązuje to i skraca całą serię.
setup("authenticate as admin", async ({ page }) => {
  setup.setTimeout(150_000);

  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Password").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });

  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: ADMIN_STATE });
});
