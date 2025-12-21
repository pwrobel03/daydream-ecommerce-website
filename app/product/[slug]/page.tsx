// app/product/[slug]/page.tsx
"use server";

import ReviewsSection from "@/components/product/reviews-section";
import Image from "next/image";
import Container from "@/components/Container";
import ProductDetails from "@/components/product/product-details";
import ProductGallery from "@/components/product/product-gallery";
import ProductHero from "@/components/product/product-hero";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/db-products";
import { getCurrentUser } from "@/lib/auth";
import { auth } from "@/auth";
import { ReviewType, UserType } from "@/types/product";

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: `${product.name} | DayDream Store`,
    description: product.description,
  };
}

interface ProductPageProps {
  params: { slug: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id;
  const product = await getProductBySlug(slug, currentUserId);

  if (!product) notFound();
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* BACKGROUND DECORATION - Dynamiczny tekst w tle */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 select-none pointer-events-none">
        <h1 className="text-[20vw] font-black text-black/[0.03] dark:text-white/[0.02] leading-none uppercase italic">
          {product.name.split(" ")[0]}
        </h1>
      </div>

      <Container className="relative z-10 pt-12 pb-24">
        <div className="grid grid-cols-12 gap-4 lg:gap-16">
          {/* GALERIA - Lewa strona (7 kolumn) */}
          <div className="col-span-12 lg:col-span-7 self-start lg:sticky lg:top-32">
            <ProductGallery images={product.images} status={product.status} />
          </div>

          {/* INFO - Prawa strona (5 kolumn) */}
          <div className="col-span-12 lg:col-span-5 flex flex-col justify-center">
            <ProductHero product={product} />
          </div>
        </div>
        <ProductDetails product={product} />
        {/* SEKCJA SKŁADNIKÓW - Bento Grid Style */}
        <ReviewsSection
          productId={product.id}
          userReview={product.userReview}
          initialReviews={product.reviews}
          totalCount={product._count.reviews}
          user={session?.user as UserType}
        />
      </Container>
    </main>
  );
}
