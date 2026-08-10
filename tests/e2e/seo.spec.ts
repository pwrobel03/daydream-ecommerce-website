import { expect, test } from "@playwright/test";

// Wszystkie te zasoby pobierają maszyny — crawlery i podglądy linków — bez sesji.
// Proxy dwukrotnie przekierowywało takie trasy na logowanie (najpierw
// /api/health, potem /opengraph-image), więc każda dostaje tu swój test.
test.describe("seo artifacts", () => {
  test("robots.txt is served and points at the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt", { maxRedirects: 0 });

    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("Disallow: /dashboard/");
    expect(body).toContain("sitemap.xml");
  });

  test("sitemap lists products, not just the static fallback", async ({ request }) => {
    const response = await request.get("/sitemap.xml", { maxRedirects: 0 });

    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("/product/");
    expect(body).toContain("/category/");
  });

  test("the opengraph image renders without a session", async ({ request }) => {
    const response = await request.get("/opengraph-image", { maxRedirects: 0 });

    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/png");
  });

  test("a product page carries Product structured data", async ({ request }) => {
    const response = await request.get("/product/test-bar");
    const html = await response.text();

    // Bez flagi /s — target ES2017 jej nie wspiera. [\s\S] robi to samo.
    const match = html.match(/application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();

    const data = JSON.parse(match![1]);
    expect(data["@type"]).toBe("Product");
    expect(data.offers.priceCurrency).toBe("USD");
    expect(data.offers.availability).toContain("InStock");
  });
});
