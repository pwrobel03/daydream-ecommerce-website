"use client";

import { useState } from "react";
import { AddressForm } from "./address-form";
import { finalizeOrderAddress } from "@/actions/order";
import PriceFormatter from "@/components/PriceFormatter";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ShieldCheck, Truck } from "lucide-react";

export function DeliveryClient({ order, savedAddress }: any) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (values: any) => {
    setLoading(true);
    const res = await finalizeOrderAddress(order.id, values);

    if (res.success) {
      toast.success("Address secured. Moving to payment.");
      // Tu w przyszłości przekierujemy do Stripe
      router.push(`/checkout/payment/${order.id}`);
    } else {
      toast.error(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
      {/* LEWA: FORMULARZ */}
      <div className="lg:col-span-7 space-y-12">
        <div className="flex items-center gap-4 text-primary">
          <Truck size={32} />
          <h2 className="text-3xl font-black italic uppercase tracking-tight">
            Destination
          </h2>
        </div>

        <AddressForm
          initialData={savedAddress}
          onSubmit={onSubmit}
          isLoading={loading}
        />
      </div>

      {/* PRAWA: PODSUMOWANIE REZERWACJI */}
      <div className="lg:col-span-5">
        <div className="sticky top-10 bg-zinc-900 text-white p-12 rounded-[2.5rem] shadow-2xl space-y-8">
          <div className="flex items-center gap-3 text-primary">
            <ShieldCheck size={20} />
            <h2 className="text-xl font-black italic uppercase tracking-widest">
              Reserved Items
            </h2>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
            {order.items.map((item: any) => (
              <div
                key={item.id}
                className="flex justify-between items-center border-b border-white/10 pb-4"
              >
                <div>
                  <p className="font-black uppercase italic text-sm tracking-tight">
                    {item.product.name}
                  </p>
                  <p className="text-[10px] opacity-40 font-black uppercase">
                    Qty: {item.quantity}
                  </p>
                </div>
                <p className="font-black italic text-primary">
                  <PriceFormatter amount={Number(item.price) * item.quantity} />
                </p>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-white/20">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                Total Value
              </span>
              <span className="text-5xl font-black italic tracking-tighter text-primary">
                <PriceFormatter amount={order.totalAmount} />
              </span>
            </div>
          </div>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed opacity-60 text-center">
              Your items are currently locked in our vault. Complete address
              details to proceed to secure checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
