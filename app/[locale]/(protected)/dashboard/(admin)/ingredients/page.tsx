import { RowsSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import Link from "next/link";
import { Plus, Edit3 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getIngredients } from "@/lib/db-inventory";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import { DeleteIngredientButton } from "@/app/[locale]/(protected)/dashboard/_components/delete-ingredient-button";

async function IngredientsListPageContent() {
  const t = await getTranslations("dashboard");
  const ingredients = await getIngredients();

  const fallbackImage = "/static/placeholder-ingredient.webp";

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <h1 className="text-2xl font-semibold leading-tight">
          {t("ingredients.title")}
        </h1>
        <Button asChild>
          <Link href="/dashboard/ingredients/new">
            <Plus aria-hidden />
            {t("ingredients.add")}
          </Link>
        </Button>
      </header>

      {ingredients.length === 0 ? (
        <p className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          {t("ingredients.empty")}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ingredients.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted">
                <Image
                  src={item.image || fallbackImage}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>

              <p className="line-clamp-2 min-w-0 flex-1 break-words font-medium">
                {item.name}
              </p>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  aria-label={t("actions.edit", { name: item.name })}
                >
                  <Link href={`/dashboard/ingredients/${item.id}`}>
                    <Edit3 />
                  </Link>
                </Button>
                {/* Osobny komponent dla usuwania, by obsłużyć Client Side Action */}
                <DeleteIngredientButton id={item.id} name={item.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function IngredientsListPage() {
  return (
    <Suspense fallback={<RowsSkeleton />}>
      <IngredientsListPageContent />
    </Suspense>
  );
}
