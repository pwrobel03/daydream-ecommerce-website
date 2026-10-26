import { beforeEach, describe, expect, it, vi } from "vitest";

const { productFindMany, categoryFindMany, reportError } = vi.hoisted(() => ({
  productFindMany: vi.fn(),
  categoryFindMany: vi.fn(),
  reportError: vi.fn(),
}));

vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));
vi.mock("@/lib/env", () => ({ env: { NEXT_PUBLIC_APP_URL: "https://shop.example.com" } }));
vi.mock("@/lib/logger", () => ({ reportError }));
vi.mock("@/lib/db", () => ({
  db: { product: { findMany: productFindMany }, category: { findMany: categoryFindMany } },
}));

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

const BASE = "https://shop.example.com";

beforeEach(() => vi.clearAllMocks());

describe("robots()", () => {
  it("points the sitemap line at the configured base", async () => {
    expect((await robots()).sitemap).toBe(`${BASE}/sitemap.xml`);
  });
});

describe("sitemap()", () => {
  it("lists static routes, categories and products under the configured base", async () => {
    productFindMany.mockResolvedValue([{ slug: "oats", updatedAt: new Date("2026-01-01") }]);
    categoryFindMany.mockResolvedValue([{ slug: "granola" }]);

    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toContain(`${BASE}/category/granola`);
    expect(urls).toContain(`${BASE}/product/oats`);
    expect(urls).toHaveLength(5);
    expect(urls.every((u) => u.startsWith(BASE))).toBe(true);
  });

  it("falls back to the static routes when the database throws", async () => {
    productFindMany.mockRejectedValue(new Error("db down"));
    categoryFindMany.mockResolvedValue([]);

    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toEqual([BASE, `${BASE}/category/all`, `${BASE}/privacy`]);
    expect(reportError).toHaveBeenCalled();
  });
});
