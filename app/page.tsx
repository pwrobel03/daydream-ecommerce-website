import { Button } from "@/components/ui/button";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { LoginButton } from "@/components/auth/login-button";
import DiscountBanner from "@/components/discount-banner";
import Container from "@/components/Container";

const font = Poppins({
  subsets: ["latin"],
  weight: ["600"],
});

import { getAllSales } from "@/lib/db-sales";

export default async function Home() {
  const sales = await getAllSales();

  if (sales.length === 0) return null;
  return (
    // <div className="bg-card border p-4 rounded-2xl hoverEffect cursor-pointer">
    //   <div className="aspect-square bg-accent rounded-xl mb-4">
    //     {/* Miejsce na zdjęcie Granoli */}
    //   </div>
    //   <h3 className="font-bold text-lg">Granola Orzechowa</h3>
    //   <p className="text-primary font-bold">24.90 zł</p>
    // </div>
    <Container>
      <DiscountBanner sales={sales} />
    </Container>
  );
}
