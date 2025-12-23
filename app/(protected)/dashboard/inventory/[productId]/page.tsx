import { db } from "@/lib/db";
import { ProductForm } from "../../_components/product-form";
import { notFound } from "next/navigation";
import { ProductType } from "@/types/product";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const isNew = productId === "new";

  // get helpfull data for product
  const [categories, ingredients, statuses] = await Promise.all([
    db.category.findMany({
      include: { children: true },
      where: { parentId: null },
      orderBy: { name: "asc" },
    }),
    db.ingredient.findMany({ orderBy: { name: "asc" } }),
    db.status.findMany({ orderBy: { name: "asc" } }),
  ]);

  let product: ProductType | null = null;

  // get existing product data
  if (!isNew) {
    const rawProduct = await db.product.findUnique({
      where: { id: productId },
      include: {
        categories: true,
        ingredients: true,
        images: true,
        status: true,
      },
    });

    if (!rawProduct) notFound();

    product = {
      ...rawProduct,
      price: Number(rawProduct.price),
      promoPrice: rawProduct.promoPrice ? Number(rawProduct.promoPrice) : null,
      createdAt: rawProduct.createdAt.toISOString(),
    } as unknown as ProductType;
  }

  return (
    <div className="space-y-12 pb-20 p-10">
      <header className="flex flex-col gap-2 border-b border-black/5 pb-10">
        <h1 className="text-7xl font-black italic uppercase tracking-tighter text-zinc-900">
          {isNew ? "New Artifact" : "Edit Essence"}
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 ml-1">
          {isNew ? "Create a new product" : `Modifying: ${product?.name}`}
        </p>
      </header>

      <ProductForm
        initialData={product}
        categories={categories}
        ingredients={ingredients}
        statuses={statuses}
      />
    </div>
  );
}
