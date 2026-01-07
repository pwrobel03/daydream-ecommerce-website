import { Button } from "@/components/ui/button";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { LoginButton } from "@/components/auth/login-button";
import DiscountBanner from "@/components/discount-banner";
import Container from "@/components/Container";
import { CategorySection } from "@/components/category-section";
import { getMainCategories } from "@/lib/db-categories";
import Image from "next/image";
import AboutUs from "@/components/home/about-us";

import { getAllSales } from "@/lib/db-sales";
import HandcraftedProcess from "@/components/home/handcrafted-process";

export default async function Home() {
  const sales = await getAllSales();
  const categories = await getMainCategories();

  return (
    // <div className="bg-card border p-4 rounded-2xl hoverEffect cursor-pointer">
    //   <div className="aspect-square bg-accent rounded-xl mb-4">
    //     {/* Miejsce na zdjęcie Granoli */}
    //   </div>
    //   <h3 className="font-bold text-lg">Granola Orzechowa</h3>
    //   <p className="text-primary font-bold">24.90 zł</p>
    // </div>
    <Container>
      {sales && <DiscountBanner sales={sales} />}
      <AboutUs />
      {categories && <CategorySection categories={categories} />}
      <HandcraftedProcess />
    </Container>
  );
}
