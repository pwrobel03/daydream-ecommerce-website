import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia" as any, // Używamy najnowszej stabilnej wersji
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("Stripe-Signature") as string;


  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`❌ Webhook Signature Error: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  console.log(`🔔 Otrzymano event: ${event.type}`);
  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session?.metadata?.orderId;

  // fallback
  if (!orderId) return new NextResponse("No Order ID", { status: 200 });

  // 1. SCENARIUSZ: PŁATNOŚĆ UDANA
  if (event.type === "checkout.session.completed") {
    await db.order.update({
      where: { id: orderId },
      data: { isPaid: true, status: "PAID" },
    });
    console.log(`✅ Order ${orderId} PAID`);
  }

  // 2. SCENARIUSZ: PŁATNOŚĆ NIEUDANA / SESJA WYGASŁA
  // Stripe domyślnie wygasza sesję po 24h, jeśli nie ma zapłaty
  if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
    
    console.log(`Logika RESTOCK dla zamówienia: ${orderId}`);

    // Używamy transakcji, aby mieć pewność, że wszystko się uda
    await db.$transaction(async (tx) => {
      // Pobieramy produkty z tego zamówienia
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (order && order.status === "PENDING") {
        // Oddajemy towar do magazynu dla każdego przedmiotu
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }

        // Zmieniamy status zamówienia na CANCELLED
        await tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" }
        });
      }
    });

    console.log(`♻️ Stock restored for cancelled order: ${orderId}`);
  }

  return new NextResponse("Webhook received", { status: 200 }); // MUSI BYĆ 200
}