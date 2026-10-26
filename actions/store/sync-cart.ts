"use server";
import { db } from "@/lib/db";

/**
 * Aktualne ceny i stany dla produktów w koszyku.
 *
 * Bez `catch`: zwracanie `[]` przy awarii bazy oznaczało dla `syncItems`
 * "nic nie wymagało aktualizacji", więc koszyk szedł dalej z cenami sprzed
 * dowolnie długiego czasu, a interfejs pokazywał, że kontrola się powiodła.
 * Na ścieżce płatności to najgorsze możliwe zachowanie — wywołujący ma
 * zobaczyć, że sprawdzenie nie przeszło.
 *
 * Brak produktu na liście wyniku znaczy, że zniknął z katalogu; `syncItems`
 * usuwa wtedy pozycję z koszyka.
 */
export async function getFreshCartData(productIds: string[]) {
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      price: true,
      promoPrice: true,
      stock: true,
      name: true,
    },
  });

  // Jawne pola zamiast spreadu: spread kopiuje też własności symboliczne
  // wyniku Prismy, których granica serwer/klient nie przepuszcza.
  return products.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    promoPrice: product.promoPrice,
    stock: product.stock,
  }));
}

/** Kształt zwracany przez `getFreshCartData` — odświeżone ceny i stan magazynowy. */
export type CartSyncProduct = Awaited<
  ReturnType<typeof getFreshCartData>
>[number];
