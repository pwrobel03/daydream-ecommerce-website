import { Suspense } from "react";
import { FormSkeleton } from "@/components/skeletons";
import { getSession } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import { DeliveryClient } from "@/components/cart/delivery-client";
import { getOrderForDelivery, getUserAddress } from "@/lib/db-orders";

async function DeliveryPageContent({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await getSession();
  const { orderId } = await params;

  if (!session?.user?.id) redirect("/auth/login");

  const [order, savedAddress] = await Promise.all([
    getOrderForDelivery(session.user.id, orderId),
    getUserAddress(session.user.id),
  ]);

  if (!order) notFound();

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
        order={order}
        savedAddress={savedAddress}
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
