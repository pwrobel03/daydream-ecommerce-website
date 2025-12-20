"use server";
import { getProductBySlug } from "@/lib/db-products";
import { notFound } from "next/navigation";
import Container from "@/components/Container";
import ProductGallery from "@/components/product/product-gallery";
import ProductDetails from "@/components/product/product-details";
import ReviewsSection from "@/components/product/reviews-section";

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Produkt nie znaleziony" };

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
  const product = await getProductBySlug(slug);

  if (!product) {
    return <>No product</>;
  }

  return (
    <Container className="py-8 sm:py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Lewa: Galeria zdjęć */}
        <ProductGallery images={product.images} />

        {/* Prawa: Informacje i przyciski */}
        <ProductDetails product={product} />
      </div>

      {/* Dół: Składniki i Opinie */}
      <div className="mt-16 space-y-16">
        <ReviewsSection reviews={product.reviews} productId={product.id} />
      </div>
    </Container>
  );
}
