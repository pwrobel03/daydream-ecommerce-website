import { Suspense } from "react";
import DiscountBanner from "@/components/discount-banner";
import Container from "@/components/Container";
import { CategorySection } from "@/components/category-section";
import { getMainCategories } from "@/lib/db-categories";
import AboutUs from "@/components/home/about-us";
import { getAllSales } from "@/lib/db-sales";
import HandcraftedProcess from "@/components/home/handcrafted-process";
import { BannerSkeleton, CategoryStripSkeleton } from "@/components/skeletons";

async function Sales() {
  const sales = await getAllSales();
  return sales ? <DiscountBanner sales={sales} /> : null;
}

async function Categories() {
  const categories = await getMainCategories();
  return categories ? <CategorySection categories={categories} /> : null;
}

export default function Home() {
  return (
    <Container>
      <Suspense fallback={<BannerSkeleton />}>
        <Sales />
      </Suspense>

      <AboutUs />

      <Suspense fallback={<CategoryStripSkeleton />}>
        <Categories />
      </Suspense>

      <HandcraftedProcess />
    </Container>
  );
}
