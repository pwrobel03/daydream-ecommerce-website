import type { ExtendedPrismaClient } from "@/lib/db";

/**
 * Czyści dane transakcyjne między testami, w kolejności zgodnej z kluczami obcymi.
 *
 * Suity dzielą jedną bazę i każda czyściła tylko te tabele, których sama
 * używa. Wystarczyło, że analityka zostawiła po sobie `OrderItem`, a test
 * uploadów wywracał się na `product.deleteMany()` z naruszeniem
 * `OrderItem_productId_fkey` — zależnie od kolejności plików, czyli raz na
 * kilka przebiegów. Jedno miejsce z pełną listą zamyka tę klasę błędów.
 *
 * Użytkownicy zostają: każda suita zakłada swojego w `beforeAll`, a kasowanie
 * ich tutaj zmuszałoby do odtwarzania konta przed każdym testem.
 */
export async function resetDatabase(db: ExtendedPrismaClient) {
  await db.processedWebhookEvent.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.review.deleteMany();
  await db.productImage.deleteMany();
  await db.sale.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
}
