import { expect, test } from "@playwright/test";

test.describe("localisation", () => {
  test("English serves at the bare path, without a locale prefix", async ({ request }) => {
    const response = await request.get("/", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });

  test("/en redirects to the unprefixed path", async ({ request }) => {
    // localePrefix "as-needed": the default locale has no prefix, so /en is
    // canonicalised away rather than serving a duplicate of the home page.
    const response = await request.get("/en", { maxRedirects: 0 });

    expect(response.status()).toBe(307);
    expect(response.headers()["location"]).toMatch(/\/$/);
  });

  test("Polish serves under its prefix", async ({ request }) => {
    const response = await request.get("/pl", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
  });

  test("the auth guard still applies on localised paths", async ({ page }) => {
    // Regresja: reguły dostępu operują na ścieżce bez prefiksu, więc /pl/cart
    // musi być chronione tak samo jak /cart.
    await page.goto("/pl/cart");
    await page.waitForURL(/\/auth\/login/, { timeout: 30_000 });
  });

  test("machine-facing routes stay outside the locale tree", async ({ request }) => {
    for (const path of ["/api/health", "/robots.txt", "/sitemap.xml"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), `${path} should not be localised`).toBe(200);
    }
  });
});

test.describe("translated content", () => {
  test("the search page renders in the language of its URL", async ({ page }) => {
    await page.goto("/search?q=zzzzqqq");
    await expect(page.getByText(/nothing matches/i).first()).toBeVisible();

    await page.goto("/pl/search?q=zzzzqqq");
    await expect(page.getByText(/nic nie pasuje/i).first()).toBeVisible();
  });

  test("Polish uses the right plural form", async ({ request }) => {
    // ICU rozróżnia one/few/many — angielskie `count === 1 ? ... : ...`
    // dałoby "1 wyniki".
    const response = await request.get("/pl/search?q=Test");
    const html = await response.text();

    expect(html).toMatch(/1 wynik(?!i|ów)/);
  });

  test("the language switcher moves between locales on the same page", async ({ page }) => {
    await page.goto("/search?q=bar");

    await page.getByRole("group", { name: /language|język/i }).getByText("pl").click();
    await page.waitForURL(/\/pl\/search/);

    expect(new URL(page.url()).searchParams.get("q")).toBe("bar");
  });
});
