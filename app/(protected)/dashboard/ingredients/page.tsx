import Link from "next/link";
import { Plus, Edit, Trash2, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import Image from "next/image";

import { DeleteIngredientButton } from "@/app/(protected)/dashboard/_components/delete-ingredient-button";

export default async function IngredientsListPage() {
  const ingredients = await db.ingredient.findMany({
    orderBy: { name: "asc" },
  });

  const fallbackImage = "/static/placeholder-ingredient.webp";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      {/* Header w stylu NEXUS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex justify-between items-end border-b">
          <div className="space-y-1">
            <h1 className="text-6xl font-black italic uppercase tracking-tighter">
              Alchemical library
            </h1>
          </div>
        </div>
        <Link href="/dashboard/ingredients/new">
          <Button className="rounded-full h-14 px-8 bg-black hover:bg-gray-800 text-white shadow-2xl transition-all hover:scale-105 active:scale-95 group">
            <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
            Forge New Essence
          </Button>
        </Link>
      </div>

      {/* Grid Składników */}
      {ingredients.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-[3rem] bg-gray-50/50">
          <p className="text-gray-400 font-medium italic">
            Your library is currently empty...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ingredients.map((item) => (
            <div
              key={item.id}
              className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300"
            >
              {/* Ikona Składnika */}
              <div className="flex justify-center mb-6">
                <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-blue-50 to-white shadow-inner">
                  <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white shadow-sm">
                    <Image
                      src={item.image || fallbackImage}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                </div>
              </div>

              {/* Treść */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {item.name}
                </h3>
              </div>

              {/* Akcje - pojawiają się przy hover lub są subtelnie widoczne */}
              <div className="mt-8 flex items-center justify-center gap-3">
                <Link href={`/dashboard/ingredients/${item.id}`}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-all border-none"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Button>
                </Link>

                {/* Osobny komponent dla usuwania, by obsłużyć Client Side Action */}
                <DeleteIngredientButton id={item.id} />
              </div>

              {/* Dekoracyjny element NEXUS */}
              <div className="absolute top-4 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="text-blue-200" size={20} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
