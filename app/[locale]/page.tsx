import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
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

async function Hero() {
  const t = await getTranslations("home.hero");

  return (
    <section className="py-16 md:py-24">
      <h1 className="max-w-[20ch] font-display text-[clamp(2.25rem,1.5rem+3vw,3.75rem)] leading-[1.05] tracking-tight text-balance">
        {t("title")}
      </h1>
      <p className="mt-6 max-w-[65ch] text-pretty text-muted-foreground">
        {t("lead")}
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/category/all">{t("cta")}</Link>
      </Button>
    </section>
  );
}

export default function Home() {
  return (
    <Container>
      <Suspense>
        <Hero />
      </Suspense>

      <Suspense fallback={<BannerSkeleton />}>
        <Sales />
      </Suspense>

      <Suspense>
        <AboutUs />
      </Suspense>

      <Suspense fallback={<CategoryStripSkeleton />}>
        <Categories />
      </Suspense>

      <Suspense>
        <HandcraftedProcess />
      </Suspense>
    </Container>
  );
}
