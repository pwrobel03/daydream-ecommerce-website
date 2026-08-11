import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Pola pieniężne są w bazie typu `Decimal`, którego nie da się przekazać do
 * komponentu klienckiego ani porównać operatorem. Rozszerzenie zamienia je na
 * `number` **u źródła** — zmienia zarówno wartość w runtime, jak i typ, więc
 * reszta kodu nigdy nie widzi `Decimal`.
 *
 * Wcześniej robiły to trzy różne mechanizmy naraz: `JSON.parse(JSON.stringify())`,
 * ręczne mappery `Number()` i konwersje pole po polu na stronach. Typ deklarował
 * `Decimal`, runtime dawał `string` — a każde nowe pole pieniężne otwierało tę
 * dziurę na nowo.
 *
 * Uwaga: to działa dla pól skalarnych modelu. Agregaty (`_sum`, `_avg`) i
 * surowe zapytania (`$queryRaw`) rozszerzenie omijają — tam nadal trzeba rzutować.
 */
export function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

  return new PrismaClient({ adapter }).$extends({
    result: {
      product: {
        price: {
          needs: { price: true },
          compute: (p) => p.price.toNumber(),
        },
        promoPrice: {
          needs: { promoPrice: true },
          compute: (p) => (p.promoPrice === null ? null : p.promoPrice.toNumber()),
        },
      },
      order: {
        totalAmount: {
          needs: { totalAmount: true },
          compute: (o) => o.totalAmount.toNumber(),
        },
        discountAmount: {
          needs: { discountAmount: true },
          compute: (o) => o.discountAmount.toNumber(),
        },
      },
      orderItem: {
        price: {
          needs: { price: true },
          compute: (i) => i.price.toNumber(),
        },
      },
    },
  });
}

export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

declare global {
  var prisma: ExtendedPrismaClient | undefined;
}

export const db = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
