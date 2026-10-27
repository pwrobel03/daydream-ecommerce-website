import { getTranslations, setRequestLocale } from "next-intl/server";
import { FormSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import {
  getIngredients,
  getMainCategoriesWithChildren,
  getProductForm,
  getStatuses,
} from "@/lib/db-inventory";
import { ProductForm } from "../../../_components/product-form";
import { notFound } from "next/navigation";

async function ProductPageContent({
  params,
}: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  const { locale, productId } = await params;

  // Bez tego `getTranslations` czyta locale z żądania, co czyni całą trasę
  // dynamiczną i blokuje render — Next zgłasza to jako dostęp do
  // niezcache'owanych danych poza <Suspense>.
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");
  const isNew = productId === "new";

  // get helpfull data for product
  const [categories, ingredients, statuses] = await Promise.all([
    getMainCategoriesWithChildren(),
    getIngredients(),
    getStatuses(),
  ]);

  // get existing product data
  const product = isNew ? null : await getProductForm(productId);
  if (!isNew && !product) notFound();

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="flex flex-col gap-1 border-b pb-6">
        <h1 className="text-2xl font-semibold leading-tight">
          {isNew ? t("inventory.newProduct") : t("inventory.editProduct")}
        </h1>
        <p className="break-words text-muted-foreground">
          {isNew ? t("product.createTitle") : t("product.modifying", { name: product?.name ?? "" })}
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


export default function ProductPage(props: {
  params: Promise<{ locale: string; productId: string }>;
}) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <ProductPageContent {...props} />
    </Suspense>
  );
}
