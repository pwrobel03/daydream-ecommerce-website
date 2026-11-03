import { RowsSkeleton } from "@/components/skeletons";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getCategoryList } from "@/lib/db-inventory";
import { CategoryForm } from "../../_components/category-form";
import CategoryList from "../../_components/category-list";
import GiveInNotice from "../../_components/give-in-notice";

async function CategoriesPageContent() {
  const t = await getTranslations("dashboard.categories");
  const allCategories = await getCategoryList();

  const mainCategories = allCategories.filter((cat) => !cat.parentId);

  return (
    <div className="flex flex-col gap-6 pb-6">
      <header className="border-b pb-6">
        <h1 className="text-2xl font-semibold leading-tight">{t("title")}</h1>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold leading-snug">
              {t("createTitle")}
            </h2>
            <p className="text-muted-foreground">{t("createHint")}</p>
          </div>

          <CategoryForm parentCategories={mainCategories} />
          <GiveInNotice note={t("note")} />
        </section>

        <section className="flex min-w-0 flex-col gap-4">
          <h2 className="text-lg font-semibold leading-snug">
            {t("listTitle")} ({allCategories.length})
          </h2>

          <CategoryList initialCategories={allCategories} />
        </section>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<RowsSkeleton />}>
      <CategoriesPageContent />
    </Suspense>
  );
}
