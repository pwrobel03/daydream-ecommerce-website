import { auth } from "@/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Package, MapPin, UserCog, ArrowRight, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name?.split(" ")[0] || "User";

  // Pobieramy liczbę zamówień, aby dashboard był bardziej personalny
  const orderCount = await db.order.count({
    where: { userId: session?.user?.id },
  });

  const cards = [
    {
      title: "Recent Orders",
      description: "Track your current shipments and history.",
      href: "/dashboard/orders",
      icon: Package,
      count: orderCount,
      color: "bg-blue-500",
    },
    {
      title: "Address Book",
      description: "Manage your delivery and billing locations.",
      href: "/dashboard/address",
      icon: MapPin,
      color: "bg-green-500",
    },
    {
      title: "Account Settings",
      description: "Update your profile and security details.",
      href: "/dashboard/profile",
      icon: UserCog,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="container mx-auto py-20 max-w-7xl">
      {/* --- POWITANIE --- */}
      <header className="mb-20 space-y-6">
        <h1 className="text-5xl sm:text-7xl lg:text-9xl font-black italic uppercase tracking-tighter leading-none">
          Welcome, <span className="text-primary">{userName}</span>
        </h1>
        <div className="border-l-4 pl-8 py-2">
          <p className="text-xl md:text-2xl font-bold italic tracking-tight text-balance leading-relaxed">
            We're glad you vistited! In your account settings, you can check
            your
            <span className="text-primary"> recent orders </span>, manage
            <span className="text-primary"> addresses</span> and change your{" "}
            <span className="text-primary"> account details</span>.
          </p>
        </div>
      </header>

      {/* --- GRID KART --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative bg-card/60 border rounded-[2rem] p-10 transition-all hover:shadow-2xl hover:-translate-y-2 overflow-hidden"
          >
            {/* Dekoracyjne tło ikony */}
            <div
              className={cn(
                "absolute -right-4 -top-4 w-32 h-32 opacity-5 transition-transform group-hover:scale-110 group-hover:rotate-12",
                "flex items-center justify-center"
              )}
            >
              <card.icon size={120} />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between gap-12">
              <div className="space-y-4">
                <div
                  className="w-12 h-12 bg-foreground text-background rounded-2xl flex items-center justify-center group-hover:bg-primary
                  group-hover:text-white
                 transition-colors"
                >
                  <card.icon size={24} />
                </div>
                <div>
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter">
                    {card.title}
                  </h3>
                  <p className="text-sm font-bold opacity-40 uppercase tracking-tight mt-2">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                {card.count !== undefined ? (
                  <span className="text-xs font-black bg-input/50 px-4 py-2 rounded-full uppercase tracking-widest">
                    {card.count} items
                  </span>
                ) : (
                  <div />
                )}
                <div className="w-10 h-10 rounded-full border flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-all">
                  <ArrowRight size={20} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* --- SEKRETNA SEKCJA (Optional Status) --- */}
      <div className="mt-20 p-12 bg-foreground rounded-[3rem] text-background flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2 text-center md:text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">
            daydream Membership
          </p>
          <h4 className="text-4xl font-black italic uppercase tracking-tighter">
            Your Essence is secured.
          </h4>
        </div>
        <Link
          href="/"
          className="px-10 py-5 bg-background text-foreground rounded-full font-black uppercase italic hover:bg-primary hover:text-white transition-all"
        >
          Return to Store
        </Link>
      </div>
    </div>
  );
}
