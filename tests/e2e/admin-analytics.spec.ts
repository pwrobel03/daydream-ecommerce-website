import { expect, test } from "@playwright/test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { ADMIN_STATE, E2E_PRODUCT } from "./fixtures";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

test.use({ storageState: ADMIN_STATE });

const visible = (page: import("@playwright/test").Page, text: string | RegExp) =>
  page.getByText(text).filter({ visible: true });

let orderId: string;

test.beforeAll(async () => {
  const [user, product] = await Promise.all([
    db.user.findFirstOrThrow({ where: { role: "ADMIN" } }),
    db.product.findFirstOrThrow({ where: { slug: E2E_PRODUCT.slug } }),
  ]);

  // Opłacone zamówienie sprzed dwóch dni — panel bez sprzedaży pokazałby same
  // zera i test nie odróżniłby działającej agregacji od zwracania pustki.
  const order = await db.order.create({
    data: {
      userId: user.id,
      totalAmount: 120,
      isPaid: true,
      status: "PAID",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      items: {
        create: [{ productId: product.id, quantity: 3, price: 40 }],
      },
    },
  });
  orderId = order.id;
});

test.afterAll(async () => {
  await db.orderItem.deleteMany({ where: { orderId } });
  await db.order.delete({ where: { id: orderId } });
  await db.$disconnect();
});

test.describe("admin analytics", () => {
  test("reports revenue and the best seller from the database", async ({ page }) => {
    test.setTimeout(150_000);

    await page.goto("/dashboard/analytics");
    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible({
      timeout: 60_000,
    });

    await expect(visible(page, "$120.00").first()).toBeVisible();
    await expect(visible(page, E2E_PRODUCT.name).first()).toBeVisible();

    // Liczby wyliczane są na serwerze, więc muszą być w pierwszej odpowiedzi.
    const response = await page.request.get("/dashboard/analytics");
    expect(await response.text()).toContain("$120.00");
  });

  test("keeps the selected range in the URL and rejects a bogus one", async ({
    page,
  }) => {
    test.setTimeout(150_000);

    await page.goto("/dashboard/analytics?days=7");
    await expect(visible(page, "Last 7 days")).toBeVisible({ timeout: 60_000 });

    // Zakres spoza listy nie może trafić do zapytania — wracamy do domyślnych 30.
    await page.goto("/dashboard/analytics?days=99999");
    await expect(visible(page, "Last 30 days")).toBeVisible();
  });
});
