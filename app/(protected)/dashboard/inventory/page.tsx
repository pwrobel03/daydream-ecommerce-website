import { db } from "@/lib/db";
import InventoryClient from "../_components/inventory-client";
import { PackagePlus } from "lucide-react";
import Link from "next/link";

export default async function InventoryPage() {
  // Pobieramy kategorie dla filtrów (tak samo jak w CategoriesPage)
  const allCategories = await db.category.findMany({
    include: {
      children: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const mainCategories = allCategories.filter((cat) => !cat.parentId);

  return (
    <div className="space-y-16 pb-20">
      {/* HEADER - Identyczny styl co w Categories */}
      <header className="flex justify-between items-end border-b pb-10">
        <div className="space-y-1 overflow-hidden">
          <h1 className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter">
            Inventory
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 ml-1">
            Global Artifact Control
          </p>
        </div>
      </header>

      {/* Przekazujemy kategorie do klienta dla filtrów */}
      <InventoryClient categories={mainCategories} />
    </div>
  );
}
