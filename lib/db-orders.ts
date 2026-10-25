// lib/db-orders.ts
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { requireBackOffice } from "@/lib/guards";
import { toPlainDeep } from "@/lib/serialize";
import type { Prisma } from "@/lib/generated/prisma/client";

/** Order fields every back-office role may see. */
const orderSelect = {
  id: true,
  totalAmount: true,
  status: true,
  isPaid: true,
  createdAt: true,
  items: {
    select: { id: true, quantity: true, product: { select: { name: true } } },
  },
} satisfies Prisma.OrderSelect;

/** Buyer data, for ADMIN only (ADR 0009). */
const adminOrderSelect = {
  ...orderSelect,
  user: { select: { name: true, email: true } },
  address: {
    select: {
      fullName: true,
      street: true,
      city: true,
      zipCode: true,
      phone: true,
    },
  },
} satisfies Prisma.OrderSelect;

const containsI = (value: string) => ({
  contains: value,
  mode: "insensitive" as const,
});

const findAdminOrders = (where: Prisma.OrderWhereInput, skip: number, take: number) =>
  db.order.findMany({
    where,
    take,
    skip,
    select: adminOrderSelect,
    orderBy: { createdAt: "desc" },
  });

const findMaskedOrders = async (where: Prisma.OrderWhereInput, skip: number, take: number) => {
  const rows = await db.order.findMany({
    where,
    take,
    skip,
    select: { ...orderSelect, userId: true },
    orderBy: { createdAt: "desc" },
  });
  // userId stays on the server; only the pseudonym reaches the client.
  return rows.map(({ userId, ...order }) => ({
    ...order,
    customerTag: createHash("sha256").update(userId).digest("hex").slice(0, 4),
  }));
};

export type AdminOrder = Awaited<ReturnType<typeof findAdminOrders>>[number];
export type MaskedAdminOrder = Awaited<ReturnType<typeof findMaskedOrders>>[number];

type Page<M extends boolean, T> = {
  masked: M;
  orders: T[];
  totalPages: number;
  totalCount: number;
};

/**
 * Zamówienia dla panelu, ze stronicowaniem i globalnym szukaniem.
 *
 * Było Server Action wołaną z Server Componentu, czyli odczytem wystawionym
 * jako endpoint POST — tak samo jak `getVoices` i `getInventoryProducts`,
 * zanim trafiły tutaj. Bez `catch`: awaria bazy ma dać stronę błędu, a nie
 * terminal pokazujący "Active Records: 0" ze statusem 200.
 *
 * For any role other than ADMIN the query never selects the buyer or the
 * address, and search matches the order ID only; otherwise a result would
 * reveal whether a given person has ordered (ADR 0009).
 */
export const getAdminOrders = async (
  page: number = 1,
  pageSize: number = 15,
  search?: string
): Promise<Page<false, AdminOrder> | Page<true, MaskedAdminOrder>> => {
  const session = await requireBackOffice();
  const masked = session?.user?.role !== "ADMIN";

  const skip = (page - 1) * pageSize;

  const where: Prisma.OrderWhereInput = !search
    ? {}
    : masked
      ? { id: containsI(search) }
      : {
          OR: [
            { id: containsI(search) },
            { user: { name: containsI(search) } },
            { user: { email: containsI(search) } },
            { address: { street: containsI(search) } },
          ],
        };

  // Wiersze idą do komponentu klienckiego, więc muszą być zwykłymi obiektami.
  if (masked) {
    const [orders, totalCount] = await Promise.all([
      findMaskedOrders(where, skip, pageSize),
      db.order.count({ where }),
    ]);
    return {
      masked,
      orders: toPlainDeep(orders),
      totalPages: Math.ceil(totalCount / pageSize),
      totalCount,
    };
  }

  const [orders, totalCount] = await Promise.all([
    findAdminOrders(where, skip, pageSize),
    db.order.count({ where }),
  ]);
  return {
    masked,
    orders: toPlainDeep(orders),
    totalPages: Math.ceil(totalCount / pageSize),
    totalCount,
  };
};
