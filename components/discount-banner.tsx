// components/discount-banner.tsx
import { Tag } from "lucide-react";
import { getAllSales } from "@/lib/db-sales";

const DiscountBanner = async () => {
  const sales = await getAllSales();

  if (sales.length === 0) return null;

  // Bierzemy najnowszą/najbliższą wygaśnięcia promocję
  const mainSale = sales[0];

  return (
    <div className="w-full bg-accent/50 border-y border-primary/10 py-3">
      <div className="container mx-auto px-4 flex items-center justify-center gap-3">
        <Tag className="h-4 w-4 text-primary animate-pulse" />
        <p className="text-sm font-medium text-foreground tracking-tight">
          Zgarnij{" "}
          <span className="font-bold text-primary">
            {mainSale.discountValue}% zniżki
          </span>{" "}
          z kodem:
          <span className="ml-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-widest">
            {mainSale.couponCode}
          </span>
        </p>
        <span className="hidden sm:inline text-xs text-muted-foreground italic">
          (Oferta kończy się: {mainSale.validTo.toLocaleDateString("pl-PL")})
        </span>
      </div>
    </div>
  );
};

export default DiscountBanner;
