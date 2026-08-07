import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { E2E_PRODUCT, E2E_USER } from "./seed";

const db = new PrismaClient();

test.afterAll(async () => {
  await db.$disconnect();
});

async function login(page: import("@playwright/test").Page) {
  await page.goto("/auth/login");
  await page.getByPlaceholder("USER@DAYDREAM.COM").fill(E2E_USER.email);
  await page.getByPlaceholder("••••••••••••").fill(E2E_USER.password);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

test.describe("checkout", () => {
  test("reserves stock and creates a pending order priced from the database", async ({ page }) => {
    const before = await db.product.findUniqueOrThrow({
      where: { slug: E2E_PRODUCT.slug },
    });

    await login(page);

    await page.goto(`/product/${E2E_PRODUCT.slug}`);
    await expect(page.getByRole("heading", { name: E2E_PRODUCT.name })).toBeVisible();

    await page.getByRole("button", { name: /grab the dream/i }).first().click();

    await page.goto("/cart");
    await expect(page.getByText(E2E_PRODUCT.name).first()).toBeVisible();

    await page.getByRole("button", { name: /secure flow/i }).click();

    // Rezerwacja kończy się przekierowaniem na krok adresowy z id zamówienia.
    await page.waitForURL(/\/cart\/delivery\/[a-z0-9]+/i, { timeout: 30_000 });

    const orderId = page.url().split("/").pop()!;
    const order = await db.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });

    expect(order.status).toBe("PENDING");
    expect(order.isPaid).toBe(false);
    expect(order.reservedUntil).not.toBeNull();

    // Cena pochodzi z bazy, nie z koszyka w przeglądarce.
    expect(order.items).toHaveLength(1);
    expect(order.items[0].price.toNumber()).toBe(E2E_PRODUCT.price);
    expect(order.totalAmount.toNumber()).toBe(E2E_PRODUCT.price * order.items[0].quantity);

    const after = await db.product.findUniqueOrThrow({
      where: { slug: E2E_PRODUCT.slug },
    });
    expect(after.stock).toBe(before.stock - order.items[0].quantity);
  });

  test("keeps the cart out of reach for anonymous visitors", async ({ page }) => {
    await page.goto("/cart");
    await page.waitForURL(/\/auth\/login/, { timeout: 30_000 });
  });
});
