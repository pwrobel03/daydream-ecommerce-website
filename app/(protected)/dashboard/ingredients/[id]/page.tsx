import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { IngredientForm } from "../../_components/ingredient-form";

interface IngredientPageProps {
  params: Promise<{ id: string }>; // Zmiana typu na Promise
}

export default async function IngredientPage({ params }: IngredientPageProps) {
  // 1. Musisz użyć await, aby wyciągnąć id z params
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const isNew = id === "new";

  let ingredient = null;

  // 2. Teraz id będzie stringiem, a nie obietnicą
  if (!isNew) {
    ingredient = await db.ingredient.findUnique({
      where: {
        id: id,
      },
    });

    if (!ingredient) {
      notFound();
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isNew ? "Utwórz Składnik" : "Edytuj Składnik"}
          </h2>
        </div>
      </div>

      <hr className="my-6" />

      <IngredientForm initialData={ingredient} />
    </div>
  );
}
