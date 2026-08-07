import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { releaseOrderReservation } from "@/lib/orders";

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

  return NextResponse.json({ candidates: expired.length, released });
}
