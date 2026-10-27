import { getTranslations } from "next-intl/server";
import { FormSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { getIngredient } from "@/lib/db-inventory";
import { notFound } from "next/navigation";
import { IngredientForm } from "../../../_components/ingredient-form";

interface IngredientPageProps {
  params: Promise<{ id: string }>; // Zmiana typu na Promise
}

async function IngredientPageContent({ params }: IngredientPageProps) {
  const t = await getTranslations("dashboard");
  // 1. Musisz użyć await, aby wyciągnąć id z params
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const isNew = id === "new";

  let ingredient = null;

  // 2. Teraz id będzie stringiem, a nie obietnicą
  if (!isNew) {
    ingredient = await getIngredient(id);

    if (!ingredient) {
      notFound();
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="border-b pb-6">
        <h1 className="text-2xl font-semibold leading-tight">
          {isNew ? t("ingredients.create") : t("ingredients.edit")}
        </h1>
      </header>

      <IngredientForm initialData={ingredient} />
    </div>
  );
}


export default function IngredientPage(props: IngredientPageProps) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <IngredientPageContent {...props} />
    </Suspense>
  );
}
