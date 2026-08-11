import { Suspense } from "react";
import { FormSkeleton } from "@/components/skeletons";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { DeliveryClient } from "@/components/cart/delivery-client";
import { toPlainDeep } from "@/lib/dto";

async function DeliveryPageContent({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await auth();
  const { orderId } = await params;

  if (!session) redirect("/auth/login");

  // Pobieramy zamówienie i dane użytkownika z jego zapisanym adresem
  const [order, userWithAddress] = await Promise.all([
    db.order.findUnique({
      where: { id: orderId, userId: session.user.id },
      include: { items: { include: { product: true } } },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      include: { address: true },
    }),
  ]);

  if (!order) notFound();

  // Wynik Prismy niesie własności symboliczne — patrz lib/dto.
  const orderForClient = toPlainDeep(order);


  return (
    <div className="container mx-auto px-6 py-20 max-w-7xl">
      <header className="mb-16 border-b pb-10">
        <h1 className="text-7xl font-black italic uppercase tracking-tighter">
          Delivery
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70 mt-2">
          Secure Reservation ID: {orderId}
        </p>
      </header>

      <DeliveryClient
        order={orderForClient}
        savedAddress={userWithAddress?.address ?? null}
      />
    </div>
  );
}

export default function DeliveryPage(props: {
  params: Promise<{ orderId: string }>;
}) {
  return (
    <Suspense fallback={<FormSkeleton fields={5} />}>
      <DeliveryPageContent {...props} />
    </Suspense>
  );
}
