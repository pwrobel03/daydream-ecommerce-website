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
    // Weryfikacja, czy wiadomość na pewno pochodzi od Stripe
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Obsługa zdarzenia: Płatność zakończona sukcesem
  if (event.type === "checkout.session.completed") {
    const orderId = session?.metadata?.orderId;

    if (!orderId) {
      return new NextResponse("Order ID missing in metadata", { status: 400 });
    }

    // AKTUALIZACJA BAZY DANYCH
    await db.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        status: "PAID",
      },
    });
    
    console.log(`✅ Order ${orderId} marked as PAID`);
  }

  return new NextResponse(null, { status: 200 });
}