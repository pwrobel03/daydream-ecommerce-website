// lib/checkout-session.ts
import Stripe from "stripe";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const TEST_CARD_NOTE =
  "Portfolio demo: no real money moves. Pay with test card 4242 4242 4242 4242, any future expiry date, any CVC.";

/** Zamówienie w kształcie potrzebnym do zbudowania sesji płatności. */
export interface PayableOrder {
  id: string;
  discountAmount: { toString(): string };
  items: {
    quantity: number;
    price: { toString(): string };
    product: { name: string };
  }[];
}

/**
 * Tworzy sesję Stripe Checkout dla zamówienia i zapisuje jej id.
 *
 * Wydzielone, bo ta logika istniała w dwóch kopiach — przy pierwszej płatności
 * i przy ponawianiu. Kopie zdążyły się rozjechać: wersja ponawiająca budowała
 * pozycje w pełnej cenie i **gubiła rabat**, więc klient wracający do
 * przerwanej płatności płacił więcej niż przy pierwszym podejściu.
 */
export async function createCheckoutSession(
  order: PayableOrder,
  options: { cancelUrl: string; expiresInMinutes?: number }
): Promise<string> {
  // Kupon na kwotę, nie na procent: procent kazałby Stripe'owi zaokrąglić po
  // swojemu, a webhook porównuje amount_total z totalAmount i odrzuciłby
  // poprawną płatność przy różnicy o grosz.
  const discountCents = Math.round(Number(order.discountAmount) * 100);
  const discounts =
    discountCents > 0
      ? [
          {
            coupon: (
              await stripe.coupons.create({
                amount_off: discountCents,
                currency: "usd",
                duration: "once",
                name: "Discount",
              })
            ).id,
          },
        ]
      : undefined;

  const session = await stripe.checkout.sessions.create({
    ...(options.expiresInMinutes && {
      expires_at:
        Math.floor(Date.now() / 1000) + options.expiresInMinutes * 60,
    }),
    discounts,
    line_items: order.items.map((item) => ({
      price_data: {
        currency: "USD",
        product_data: { name: item.product.name },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: item.quantity,
    })),
    mode: "payment",
    // ADR 0005: the Stripe page carries the same test-card note as our screens.
    custom_text: { submit: { message: TEST_CARD_NOTE } },
    // Metadane muszą trafić także do PaymentIntenta — inaczej webhook
    // payment_intent.payment_failed nie ma jak powiązać zdarzenia z zamówieniem.
    payment_intent_data: { metadata: { orderId: order.id } },
    success_url: `${env.NEXT_PUBLIC_APP_URL}/order/success/${order.id}`,
    cancel_url: options.cancelUrl,
    metadata: { orderId: order.id },
  });

  if (session.livemode) {
    throw new Error("Stripe returned a live-mode session; only test mode is allowed");
  }

  if (!session.url) throw new Error("Stripe session failed");

  await db.order.update({
    where: { id: order.id },
    data: { stripeSessionId: session.id },
  });

  return session.url;
}
