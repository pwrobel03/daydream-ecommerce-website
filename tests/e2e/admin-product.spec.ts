import { expect, test } from "@playwright/test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { ADMIN_STATE } from "./fixtures";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

test.use({ storageState: ADMIN_STATE });

test.afterAll(async () => {
  await db.$disconnect();
});

type Page = import("@playwright/test").Page;

// Serwer dev streamuje zawartość spod Suspense obok wciąż obecnej powłoki, więc
// przez chwilę te same pola istnieją w DOM dwa razy — jedno wystąpienie ukryte.
// Bez zawężenia do widocznego Playwright trafia losowo w to drugie.
const field = (page: Page, label: string, exact = false) =>
  page.getByLabel(label, exact ? { exact: true } : undefined).filter({ visible: true });

async function openNewProductForm(page: Page) {
  // Serwer E2E chodzi w trybie dev i kompiluje trasy przy pierwszym wejściu.
  // Formularz produktu jest największym ekranem w aplikacji, więc jego pierwsza
  // kompilacja potrafi przekroczyć domyślne 60 s.
  test.setTimeout(150_000);

  await page.goto("/dashboard/inventory/new");
  await expect(field(page, "Name")).toBeVisible({ timeout: 60_000 });
}

// Formularz produktu jest jedynym ekranem łączącym pola tekstowe,
// autouzupełnianie sluga, upload i wybór wielokrotny. Do tej pory nie miał
// żadnego pokrycia, więc jego podział na sekcje byłby zmianą weryfikowaną
// wyłącznie przez kompilator.
test.describe("admin product form", () => {
  test("creates a product and derives the slug from the name", async ({ page }) => {
    const name = `Playwright Artifact ${Date.now()}`;

    await openNewProductForm(page);

    await field(page, "Name").fill(name);
    await field(page, "Description").fill("A product created by the end-to-end suite to cover the admin form.");
    await field(page, "Weight").fill("250g");
    await field(page, "Price", true).fill("42");
    await field(page, "Stock").fill("7");

    await page.getByRole("button", { name: /add product|save changes/i }).click();
    await page.waitForURL(/\/dashboard\/inventory$/, { timeout: 60_000 });

    const created = await db.product.findFirstOrThrow({ where: { name } });
    expect(Number(created.price)).toBe(42);
    expect(created.stock).toBe(7);

    // Slug powstaje z nazwy w efekcie po stronie klienta — gdyby wydzielenie
    // hooka go zgubiło, zapis nie przeszedłby walidacji długości.
    expect(created.slug).toBe(
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    );

    await db.product.delete({ where: { id: created.id } });
  });

  test("refuses a promo price that is not below the price", async ({ page }) => {
    await openNewProductForm(page);

    await field(page, "Name").fill("Overpriced Promo");
    await field(page, "Description").fill("A product whose promo price is higher than its base price.");
    await field(page, "Weight").fill("100g");
    await field(page, "Price", true).fill("10");
    await field(page, "Promo price", true).fill("20");
    await field(page, "Stock").fill("1");

    await page.getByRole("button", { name: /add product|save changes/i }).click();

    // Konkretny tekst, nie /promo/i — ten wzorzec pasował też do etykiety pola,
    // więc asercja przechodziłaby przy całkiem wyłączonej walidacji.
    await expect(
      page.getByText("The promo price must be lower than the price.")
    ).toBeVisible();

    await expect(page).toHaveURL(/\/dashboard\/inventory\/new$/);
    expect(await db.product.count({ where: { name: "Overpriced Promo" } })).toBe(0);
  });
});
