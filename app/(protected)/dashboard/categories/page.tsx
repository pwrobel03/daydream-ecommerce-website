import { db } from "@/lib/db";
import { CategoryForm } from "../_components/category-form";
import { Trash2, FolderTree, Info } from "lucide-react";
import { deleteCategory } from "@/actions/admin/admin-categories";
import CategoryList from "../_components/category-list"; // Zaraz go stworzymy

export default async function CategoriesPage() {
  // Pobieramy wszystkie kategorie, aby przekazać je do formularza (jako potencjalni rodzice)
  // oraz do listy (aby je wyświetlić)
  const allCategories = await db.category.findMany({
    include: {
      children: true, // Pobieramy subkategorie
      _count: {
        select: { products: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Filtrujemy tylko główne kategorie (te, które nie mają parentId)
  const mainCategories = allCategories.filter((cat) => !cat.parentId);

  return (
    <div className="space-y-16 pb-20">
      {/* HEADER */}
      <header className="flex justify-between items-end border-b border-black/5 pb-10">
        <div className="space-y-1">
          <h1 className="text-7xl font-black italic uppercase tracking-tighter">
            Categories
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 ml-1">
            Dream Hierarchy Management ({allCategories.length})
          </p>
        </div>
      </header>

      <div className="gap-12 items-start">
        {/* LEWA KOLUMNA: FORMULARZ DODAWANIA */}
        <div className="lg:col-span-5 space-y-6 sticky top-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
              <FolderTree className="text-primary" />
              Forge New Category
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-30">
              Create main categories or nested sub-flows
            </p>
          </div>

          {/* Przekazujemy główne kategorie jako opcje do wyboru dla subkategorii */}
          <CategoryForm parentCategories={mainCategories} />

          <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem] flex gap-4">
            <Info className="text-blue-500 shrink-0" size={20} />
            <p className="text-[10px] font-medium leading-relaxed text-blue-700 uppercase tracking-wider">
              Note: Deleting a parent category will not delete its products, but
              they will become uncategorized.
            </p>
          </div>
        </div>

        {/* PRAWA KOLUMNA: LISTA KATEGORII */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-black italic uppercase tracking-tight">
              Existing Structures
            </h2>
          </div>

          {/* Wyodrębniony komponent kliencki do interaktywnej listy */}
          <CategoryList initialCategories={allCategories} />
        </div>
      </div>
    </div>
  );
}
