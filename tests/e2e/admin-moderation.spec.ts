import { expect, test } from "@playwright/test";
import { E2E_ADMIN, E2E_REVIEWS } from "./fixtures";

const [praise, complaint] = E2E_REVIEWS;

// Serwer dev streamuje treść spod Suspense obok wciąż obecnej powłoki, więc te
// same akapity bywają w DOM dwa razy — jedno wystąpienie ukryte.
const visible = (page: import("@playwright/test").Page, text: string) =>
  page.getByText(text).filter({ visible: true });

async function openModeration(page: import("@playwright/test").Page) {
  test.setTimeout(150_000);

  await page.goto("/auth/login");
  await page.getByPlaceholder("USER@DAYDREAM.COM").fill(E2E_ADMIN.email);
  await page.getByPlaceholder("••••••••••••").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });

  await page.goto("/dashboard/comments");
  await expect(page.getByRole("heading", { name: /voices hub/i })).toBeVisible({
    timeout: 60_000,
  });
}

// Ta strona pobierała dane w useEffect, więc lista pojawiała się dopiero po
// drugim round-tripie, a filtry żyły wyłącznie w stanie komponentu. Testy
// pilnują, że po przeniesieniu na serwer treść jest w pierwszej odpowiedzi
// i że filtr faktycznie zawęża wynik.
test.describe("admin moderation", () => {
  test("renders the voices in the initial HTML, without a second request", async ({
    page,
  }) => {
    await openModeration(page);

    await expect(visible(page, praise.content)).toBeVisible();
    await expect(visible(page, complaint.content)).toBeVisible();

    // Odpowiedź serwera musi już zawierać treść — gdyby lista wracała do
    // pobierania po stronie klienta, w surowym HTML by jej nie było.
    const response = await page.request.get("/dashboard/comments");
    expect(await response.text()).toContain(praise.content);
  });

  test("filters by rating through the URL", async ({ page }) => {
    await openModeration(page);

    await page.getByRole("button", { name: "5★" }).click();
    await page.waitForURL(/rating=5/, { timeout: 30_000 });

    await expect(visible(page, praise.content)).toBeVisible();
    await expect(visible(page, complaint.content)).toHaveCount(0);

    // Filtr jest w adresie, więc przeżywa przeładowanie strony.
    await page.reload();
    await expect(visible(page, complaint.content)).toHaveCount(0);
  });
});
