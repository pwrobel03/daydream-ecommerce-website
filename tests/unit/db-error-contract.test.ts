import { beforeEach, describe, expect, it, vi } from "vitest";

// Kontrakt warstwy danych, nie zapytania: `null` / pusta lista znaczy "nie ma
// takiego rekordu", a awaria bazy leci wyżej i kończy się stroną błędu.
// Wcześniej oba przypadki wyglądały identycznie — niedostępna baza renderowała
// pusty katalog z HTTP 200. Ten test istnieje, żeby jedno `try` przez pomyłkę
// nie przywróciło tamtego zachowania.
const findUnique = vi.fn();
const findMany = vi.fn();
const count = vi.fn();
const findFirst = vi.fn();
const queryRaw = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    $queryRaw: (...args: unknown[]) => queryRaw(...args),
    category: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      findMany: (...args: unknown[]) => findMany(...args),
    },
    product: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      findMany: (...args: unknown[]) => findMany(...args),
      count: (...args: unknown[]) => count(...args),
    },
    review: {
      findMany: (...args: unknown[]) => findMany(...args),
      findFirst: (...args: unknown[]) => findFirst(...args),
    },
  },
}));

const outage = () => new Error("Can't reach database server");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("catalogue queries", () => {
  it("return null when the row simply is not there", async () => {
    const { getCategoryWithProducts, getProductBySlug } = await import(
      "@/lib/db-products"
    );

    findUnique.mockResolvedValue(null);

    expect(await getCategoryWithProducts("nope")).toBeNull();
    expect(await getProductBySlug("nope")).toBeNull();
  });

  it("let a database failure through instead of reporting an empty catalogue", async () => {
    const {
      getCategoryWithProducts,
      getProductBySlug,
      getAllProductsAsCategory,
      getTotalProductsCount,
    } = await import("@/lib/db-products");

    findUnique.mockRejectedValue(outage());
    findMany.mockRejectedValue(outage());
    count.mockRejectedValue(outage());

    await expect(getCategoryWithProducts("bars")).rejects.toThrow();
    await expect(getProductBySlug("test-bar")).rejects.toThrow();
    await expect(getAllProductsAsCategory()).rejects.toThrow();
    await expect(getTotalProductsCount()).rejects.toThrow();
  });

  it("do the same for categories", async () => {
    const { getMainCategories, getCategoryBySlug } = await import(
      "@/lib/db-categories"
    );

    findMany.mockRejectedValue(outage());
    findUnique.mockRejectedValue(outage());

    await expect(getMainCategories()).rejects.toThrow();
    await expect(getCategoryBySlug("bars")).rejects.toThrow();
  });
});

describe("search", () => {
  it("degrades to no results rather than failing the page", async () => {
    // Świadomy wyjątek od reguły wyżej: literówka przy chwilowym problemie
    // z bazą ma pokazać "brak wyników", a nie wywrócić ekran wyszukiwania.
    const { searchProducts } = await import("@/lib/db-search");

    queryRaw.mockRejectedValue(outage());

    await expect(searchProducts("bar")).resolves.toEqual([]);
  });
});
