import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { releaseOrderReservation } from "@/lib/orders";

const UNVERIFIED_TTL_MS = 24 * 60 * 60 * 1000;

// Usuwa rejestracje bez potwierdzonego e-maila starsze niż 24 h (ADR 0013).
// Konta bez aktywności tylko: `settings` zeruje emailVerified przy zmianie adresu,
// więc konto z zamówieniem, opinią, kontem OAuth lub adresem zostaje.
async function deleteUnverifiedRegistrations() {
  const where = {
    role: "USER" as const,
    emailVerified: null,
    createdAt: { lt: new Date(Date.now() - UNVERIFIED_TTL_MS) },
    orders: { none: {} },
    reviews: { none: {} },
    accounts: { none: {} },
    addressId: null,
  };
  const users = await db.user.findMany({
    where,
    select: { id: true, email: true },
    take: 200,
  });
  if (users.length === 0) return 0;

  const emails = users.flatMap((u) => (u.email ? [u.email] : []));
  // `where` powtórzone przy usuwaniu: konto mogło zyskać aktywność od odczytu.
  const [, , deleted] = await db.$transaction([
    db.verificationToken.deleteMany({ where: { email: { in: emails } } }),
    db.passwordResetToken.deleteMany({ where: { email: { in: emails } } }),
    db.user.deleteMany({ where: { ...where, id: { in: users.map((u) => u.id) } } }),
  ]);
  return deleted.count;
}

// Endpoint uruchamiany cyklicznie (systemowy cron / usługa w compose).
// Zwalnia towar zarezerwowany przez zamówienia, które nigdy nie doszły do płatności.
export async function POST(req: Request) {
  const provided = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET}`;

  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);

  if (
    providedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const expired = await db.order.findMany({
    where: {
      status: "PENDING",
      isPaid: false,
      reservedUntil: { lt: new Date() },
    },
    select: { id: true },
    take: 200,
  });

  let released = 0;
  for (const order of expired) {
    if (await releaseOrderReservation(order.id)) released += 1;
  }

  const deletedUnverified = await deleteUnverifiedRegistrations();

  return NextResponse.json({
    candidates: expired.length,
    released,
    deletedUnverified,
  });
}
