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
    <div className="space-y-12 pb-20 p-10">
      <header className="flex flex-col gap-2 border-b pb-10">
        <h1 className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter">
          {isNew ? t("inventory.newProduct") : t("ingredients.editEssence")}
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70 ml-1">
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
