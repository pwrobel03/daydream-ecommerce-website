import { expect, test } from "@playwright/test";

test.describe("health endpoint", () => {
  test("answers without a session", async ({ request }) => {
    // Regresja: endpoint nie był w publicRoutes, więc middleware odpowiadał
    // przekierowaniem na logowanie. Load balancer i monitoring odpytują go
    // anonimowo, więc taka odpowiedź czyniła go bezużytecznym.
    const response = await request.get("/api/health");

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      database: true,
      redis: true,
    });
  });

  test("does not redirect", async ({ request }) => {
    const response = await request.get("/api/health", { maxRedirects: 0 });

    expect(response.status()).toBe(200);
  });
});
