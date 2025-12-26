// actions/order.ts
"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";

export async function initializeOrder(items: any[]) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Musisz być zalogowany, aby kontynuować." };
  }

  try {
    const orderId = await db.$transaction(async (tx) => {
      let total = 0;

      // 1. Walidacja stanów i obliczenie sumy
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.product.id },
        });

        if (!product || product.stock < item.quantity) {
          throw new Error(`Produkt ${item.product.name} jest już niedostępny.`);
        }

        const price = product.promoPrice ? Number(product.promoPrice) : Number(product.price);
        total += price * item.quantity;

        // 2. Odejmujemy stan magazynowy
        await tx.product.update({
          where: { id: item.product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 3. Tworzymy zamówienie (PENDING, bez adresu)
      const order = await tx.order.create({
        data: {
          userId: session.user.id!,
          totalAmount: total,
          items: {
            create: items.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              price: item.product.promoPrice || item.product.price, // Snapshot ceny
            })),
          },
        },
      });

      return order.id;
    });

    return { success: true, orderId };
  } catch (error: any) {
    return { error: error.message || "Coś poszło nie tak podczas rezerwacji." };
  }
}

export async function finalizeOrderAddress(orderId: string, addressData: any) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Tworzymy lub aktualizujemy rekord adresu
      const address = await tx.address.create({
        data: {
          ...addressData,
        },
      });

      // 2. Łączymy adres z zamówieniem
      await tx.order.update({
        where: { id: orderId, userId: session.user.id },
        data: { addressId: address.id },
      });

      // 3. Aktualizujemy stały adres w profilu użytkownika
      await tx.user.update({
        where: { id: session.user.id },
        data: { addressId: address.id },
      });

      return { success: "Delivery details provide correctly!!" };
    });

    revalidatePath(`/cart/delivery/${orderId}`);
    return { success: "Delivery details provide correctly!!"};
  } catch (error) {
    return { error: "Failed to finalize delivery details." };
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function finalizeAndPay(orderId: string, addressData: any) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    // Wyciągamy sam string URL z transakcji
    const url = await db.$transaction(async (tx) => {
      // 1. Zapisujemy adres
      const address = await tx.address.create({ data: { ...addressData } });

      // 2. Aktualizujemy zamówienie i profil
      const order = await tx.order.update({
        where: { id: orderId },
        data: { addressId: address.id },
        include: { items: { include: { product: true } } }
      });

      await tx.user.update({
        where: { id: session.user.id },
        data: { address: { connect: { id: address.id } } }
      });

      // 3. TWORZYMY SESJĘ STRIPE
      const stripeSession = await stripe.checkout.sessions.create({
        line_items: order.items.map(item => ({
          price_data: {
            currency: "USD",
            product_data: { name: item.product.name },
            unit_amount: Math.round(Number(item.price) * 100),
          },
          quantity: item.quantity,
        })),
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/success/${orderId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
        metadata: { orderId }
      });

      if (!stripeSession.url) throw new Error("Stripe session failed");

      // Zapisujemy ID sesji w zamówieniu
      await tx.order.update({
        where: { id: orderId },
        data: { stripeSessionId: stripeSession.id }
      });

      return stripeSession.url; // Zwracamy czysty string
    });

    return { url, error: null }; // Sukces: zwracamy płaski obiekt z url
  } catch (error: any) {
    console.error(error);
    return { url: null, error: "Stripe Session Error" }; // Błąd: url to null
  }
}