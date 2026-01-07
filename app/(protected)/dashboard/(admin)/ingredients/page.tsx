import Link from "next/link";
import { Plus, Edit, Trash2, ArrowRight, Edit3 } from "lucide-react";
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
      <header className="flex justify-between items-end border-b pb-10">
        <div className="space-y-1">
          <h1 className="text-7xl font-black italic uppercase tracking-tighter">
            Alchemical library
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 ml-1">
            Manage your recipe
          </p>
        </div>
      </header>
      <Link href="/dashboard/ingredients/new" className="flex mb-10">
        <Button className="rounded-full h-14 px-8 transition-all hover:scale-105 active:scale-95 group">
          <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
          Forge New Essence
        </Button>
      </Link>

      {/* Grid Składników */}
      {ingredients.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed">
          <p className="font-medium italic">
            Your ingredients library is currently empty...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ingredients.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-[1rem] p-6 shadow-sm hover:shadow-xl transition-all bg-card/60 duration-300"
            >
              {/* Ikona Składnika */}
              <div className="flex justify-center mb-6">
                <div className="relative w-24 h-24 rounded-full p-1 shadow-inner">
                  <div className="relative w-full h-full rounded-full overflow-hidden border-2 shadow-sm">
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
                <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                  {item.name}
                </h3>
              </div>

              {/* Akcje - pojawiają się przy hover lub są subtelnie widoczne */}
              <div className="mt-8 flex items-center justify-center gap-3">
                <Link href={`/dashboard/ingredients/${item.id}`}>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-10 h-10 rounded-full border bg-card flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-500 shadow-sm group/btn text-foreground"
                  >
                    <Edit3
                      size={16}
                      className="group-hover/btn:rotate-12 transition-transform"
                    />
                  </Button>
                </Link>

                {/* Osobny komponent dla usuwania, by obsłużyć Client Side Action */}
                <DeleteIngredientButton id={item.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
