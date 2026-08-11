import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { expectOk } from "../helpers/action-result";

// Ta sama konstrukcja co w order.test.ts: prawdziwa baza, podmieniona wyłącznie
// sesja. Uploady dotykają dysku, więc `UPLOAD_DIR` wskazuje katalog testowy.
const { session, db } = await vi.hoisted(async () => {
  const { createPrismaClient } = await import("@/lib/db");
  return {
    session: { user: { id: "admin-uploads", role: "ADMIN" as const } },
    db: createPrismaClient(),
  };
});

vi.mock("@/auth", () => ({ auth: async () => session }));
vi.mock("@/lib/db", () => ({ db }));

// revalidatePath wymaga kontekstu żądania Next, którego w teście nie ma.
// Podmieniamy je, bo przedmiotem testu jest sprzątanie plików, nie cache.
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const { deleteProduct } = await import("@/actions/admin/inventory");
const { UPLOAD_URL_PREFIX, resolveUploadPath } = await import("@/lib/uploads");

async function placeFile(url: string) {
  const target = resolveUploadPath(url);
  if (!target) throw new Error(`url poza katalogiem uploadu: ${url}`);

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, "pozorna zawartość");
  return target;
}

afterAll(async () => {
  await db.$disconnect();
});

let productId: string;

beforeAll(async () => {
  await db.user.create({
    data: { id: "admin-uploads", email: "uploads@example.com", role: "ADMIN" },
  });
});

beforeEach(async () => {
  await db.productImage.deleteMany();
  await db.product.deleteMany();

  const product = await db.product.create({
    data: { name: "Bar", slug: `bar-${Date.now()}`, price: 25, stock: 10 },
  });
  productId = product.id;
});

describe("deleteProduct", () => {
  it("removes the image files, not just the rows", async () => {
    // Kaskada w bazie kasuje wiersze ProductImage sama z siebie, więc bez
    // jawnego sprzątania pliki zostawały na wolumenie na zawsze — bez żadnego
    // sygnału aż do zapełnienia dysku.
    const urls = [
      `${UPLOAD_URL_PREFIX}/products/${productId}/one.webp`,
      `${UPLOAD_URL_PREFIX}/products/${productId}/two.webp`,
    ];

    const paths = [];
    for (const url of urls) {
      paths.push(await placeFile(url));
      await db.productImage.create({ data: { url, productId } });
    }

    expect(paths.every(existsSync)).toBe(true);

    expectOk(await deleteProduct(productId));

    expect(await db.product.count()).toBe(0);
    expect(paths.some(existsSync)).toBe(false);
  });

  it("still deletes the product when a file is already gone", async () => {
    // Rekord wskazujący na nieistniejący plik nie może blokować usunięcia —
    // inaczej jedna rozjechana ścieżka unieruchamia produkt na stałe.
    await db.productImage.create({
      data: { url: `${UPLOAD_URL_PREFIX}/products/${productId}/missing.webp`, productId },
    });

    expectOk(await deleteProduct(productId));
    expect(await db.product.count()).toBe(0);
  });
});
