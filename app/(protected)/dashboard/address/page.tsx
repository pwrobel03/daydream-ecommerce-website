import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AddressForm } from "../_components/address-form";
import { Globe } from "lucide-react";

export default async function AddressPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { address: true },
  });

  return (
    <div className="container mx-auto px-6 py-20 max-w-5xl">
      <header className="mb-24 relative">
        <div className="absolute -left-12 top-0 text-[15rem] font-black italic opacity-[0.03] select-none leading-none">
          LOC
        </div>
        <h1 className="text-5xl sm:txt-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none relative z-10">
          Delivery<span className="text-primary">.</span>
        </h1>
        <p className="text-xs font-black uppercase tracking-[0.6em] opacity-40 mt-6 flex items-center gap-4">
          <Globe size={14} className="text-primary" />
          Global Logistics and Coordinate Management
        </p>
      </header>

      <div className="relative">
        {/* Dekoracyjna linia boczna */}
        <div className="absolute -left-6 top-0 bottom-0 w-[1px] bg-gradient-to-b from-primary via-black/5 to-transparent hidden md:block" />

        <AddressForm initialData={user?.address} />
      </div>
    </div>
  );
}
