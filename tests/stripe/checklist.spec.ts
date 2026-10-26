// Lista kontrolna Stripe z #41 (przypadki 2, 3 i 5) na prawdziwej stronie Stripe
// Checkout w trybie testowym. Wymaga `stripe listen` przekazującego zdarzenia do
// aplikacji (STRIPE_LISTEN_LOG to jego log) i klucza dla CLI w środowisku.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { PrismaPg } from "@prisma/adapter-pg";
import Stripe from "stripe";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { E2E_PRODUCT, E2E_USER } from "../e2e/fixtures";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

test.afterAll(async () => {
  await db.$disconnect();
});

const stock = async () => (await db.product.findUniqueOrThrow({ where: { slug: E2E_PRODUCT.slug } })).stock;
const orderOf = (id: string) => db.order.findUniqueOrThrow({ where: { id } });

async function login(page: Page) {
  await page.goto("/auth/login");
  await page.getByPlaceholder("USER@DAYDREAM.COM").fill(E2E_USER.email);
  await page.getByPlaceholder("••••••••••••").fill(E2E_USER.password);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

/** Koszyk, rezerwacja, adres, przekierowanie na stronę Stripe. Zwraca id zamówienia. */
async function startCheckout(page: Page) {
  await login(page);
  await page.goto(`/product/${E2E_PRODUCT.slug}`);
  await page.getByRole("button", { name: /grab the dream/i }).first().click();
  await page.goto("/cart");
  await page.getByRole("button", { name: /secure flow/i }).click();
  await page.waitForURL(/\/cart\/delivery\/[a-z0-9]+/i, { timeout: 30_000 });
  const orderId = page.url().split("/").pop()!;

  await page.getByPlaceholder("Enter Name...").fill("Stripe Checklist");
  await page.getByPlaceholder("+48 --- --- ---").fill("123456789");
  await page.getByPlaceholder("Street & Number...").fill("Main Street 1");
  await page.getByPlaceholder("00-000").fill("00-001");
  await page.getByPlaceholder("City Name...").fill("Warsaw");
  await page.getByRole("button", { name: /pay with stripe/i }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 });
  return orderId;
}

/** Wpisuje kartę na stronie Stripe i zatwierdza. */
async function payWith(page: Page, card: string) {
  await page.locator("#cardNumber").fill(card);
  await page.locator("#cardExpiry").fill("12 / 34");
  await page.locator("#cardCvc").fill("123");
  // Które pola Stripe pokazuje, zależy od konta i kraju — wypełniamy te, które są.
  for (const [selector, value] of [
    ["#email", E2E_USER.email],
    ["#billingName", "Stripe Checklist"],
    ["#billingPostalCode", "10001"],
  ]) {
    const field = page.locator(selector).first();
    if ((await field.count()) && (await field.isVisible()) && !(await field.inputValue())) {
      await field.fill(value);
    }
  }
  // Zaznaczone domyślnie Link wymaga telefonu, a nie jest częścią listy kontrolnej.
  await page.getByRole("checkbox", { name: /save my information/i }).uncheck().catch(() => {});
  await page.getByTestId("hosted-payment-submit-button").click();
}

test.describe.configure({ mode: "serial" });

test("Case 2: successful payment, stock back to original, resent event changes nothing", async ({ page }) => {
  const original = await stock();
  const orderId = await startCheckout(page);
  expect(await stock()).toBeLessThan(original);

  await payWith(page, "4242 4242 4242 4242");
  await page.waitForURL(/\/order\/success\//, { timeout: 90_000 });
  await expect.poll(async () => (await orderOf(orderId)).status, { timeout: 60_000 }).toBe("PAID");
  expect(await stock()).toBe(original);

  const sessionId = (await orderOf(orderId)).stripeSessionId!;
  let eventId = "";
  await expect
    .poll(
      async () => {
        const events = await stripe.events.list({ type: "checkout.session.completed", limit: 50 });
        eventId = events.data.find((e) => (e.data.object as { id: string }).id === sessionId)?.id ?? "";
        return eventId;
      },
      { timeout: 60_000 },
    )
    .not.toBe("");

  const deliveries = () => readFileSync(process.env.STRIPE_LISTEN_LOG!, "utf8").split(eventId).length - 1;
  const before = deliveries();
  execFileSync("stripe", ["events", "resend", eventId], { stdio: "pipe" });
  // Dowód, że zdarzenie wróciło do aplikacji, zanim sprawdzimy, że nic nie zmieniło.
  await expect.poll(deliveries, { timeout: 60_000 }).toBeGreaterThan(before);
  await page.waitForTimeout(3_000);

  expect((await orderOf(orderId)).status).toBe("PAID");
  expect(await stock()).toBe(original);
  expect(await db.processedWebhookEvent.count({ where: { id: eventId } })).toBe(1);
});

test("Case 3: declined card, then a good card on the same Checkout page", async ({ page }) => {
  const original = await stock();
  const orderId = await startCheckout(page);

  await payWith(page, "4000 0000 0000 0002");
  await expect(page.getByText(/card was declined/i).first()).toBeVisible({ timeout: 60_000 });
  expect(page.url()).toContain("checkout.stripe.com");

  await page.locator("#cardNumber").fill("4242 4242 4242 4242");
  await page.getByTestId("hosted-payment-submit-button").click();
  await page.waitForURL(/\/order\/success\//, { timeout: 90_000 });

  await expect.poll(async () => (await orderOf(orderId)).status, { timeout: 60_000 }).toBe("PAID");
  expect(await stock()).toBe(original);
});

test("Case 5: expired session, cron call, stock returned exactly once", async ({ page }) => {
  const original = await stock();
  const orderId = await startCheckout(page);
  expect(await stock()).toBeLessThan(original);

  const expiredBefore = await db.processedWebhookEvent.count({ where: { type: "checkout.session.expired" } });
  await stripe.checkout.sessions.expire((await orderOf(orderId)).stripeSessionId!);
  await expect
    .poll(() => db.processedWebhookEvent.count({ where: { type: "checkout.session.expired" } }), { timeout: 60_000 })
    .toBeGreaterThan(expiredBefore);

  const res = await fetch("http://localhost:3100/api/cron/release-reservations", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });
  expect(res.status).toBe(200);

  expect((await orderOf(orderId)).status).toBe("CANCELLED");
  expect(await stock()).toBe(original);
});
