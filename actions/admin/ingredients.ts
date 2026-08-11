"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { deleteUpload, processAndStore } from "@/lib/uploads";
import { revalidatePath } from "next/cache";
import path from "path";
import crypto from "crypto";
import { reportError } from "@/lib/logger";
import { ActionResult, fail, failFrom, ok } from "@/lib/action-result";


export async function upsertIngredient(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const isNew = id === "new";
    const name = formData.get("name") as string;
    const imageFile = formData.get("image") as File | null;
    const removeExistingImage = formData.get("removeImage") === "true";

    // 1. Walidacja unikalności nazwy
    const existing = await db.ingredient.findFirst({ where: { name } });
    if (existing && (isNew || existing.id !== id)) {
      return fail("CONFLICT", "Ingredient with this name already exists.");
    }

    // 2. Przygotowanie ID i katalogu głównego
    // Jeśli nowy, generujemy UUID od razu, zamiast tworzyć "Temp" w bazie
    const ingredientId = isNew ? crypto.randomUUID() : id;
    

    let imagePath: string | null | undefined = undefined;

    // Poprzedni plik trzeba znać przed zapisem nowego, żeby po udanej
    // aktualizacji rekordu usunąć dokładnie ten, który przestał być używany.
    const previousImage = isNew
      ? null
      : (await db.ingredient.findUnique({ where: { id } }))?.image ?? null;

    // 3. Procesowanie zdjęcia
    if (imageFile && imageFile.size > 0) {
      // Nazwa losowa przy każdym zapisie, jak dla produktów i kategorii.
      // Wcześniej plik nazywał się identyfikatorem składnika, więc podmiana
      // nadpisywała ten sam URL — a trasa /uploads serwuje go z nagłówkiem
      // `immutable` na rok, przez co odwiedzający dostawali stary obrazek
      // nawet po wymuszonym odświeżeniu.
      imagePath = await processAndStore(imageFile, {
        dir: "ingredients",
        fileName: crypto.randomUUID(),
        width: 400,
        height: 400,
        fit: "cover",
      });
    } else if (removeExistingImage) {
      // Jeśli usuwamy zdjęcie, musimy usunąć plik fizyczny
      imagePath = null;
    }

    // 4. Update lub Create w bazie (Upsert)
    await db.ingredient.upsert({
      where: { id: ingredientId },
      update: {
        name,
        ...(imagePath !== undefined && { image: imagePath })
      },
      create: {
        id: ingredientId,
        name,
        image: imagePath ?? null
      }
    });

    // Dopiero po udanym zapisie rekordu — gdyby upsert padł, plik nadal jest
    // tym, na który wskazuje baza.
    if (previousImage && imagePath !== undefined && previousImage !== imagePath) {
      await deleteUpload(previousImage);
    }

    revalidatePath("/dashboard/ingredients");
    return ok();

  } catch (error) {
    reportError(error, { area: "admin.ingredients" });
    return failFrom(error, "INTERNAL", "Failed to save ingredient.");
  }
}

export async function deleteIngredient(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const ingredient = await db.ingredient.findUnique({
      where: { id },
      include: { products: true }
    });

    if (!ingredient) return fail("NOT_FOUND", "Ingredient not found.");
    if (ingredient.products.length > 0) {
      return fail("CONFLICT", "Cannot delete: ingredient is used in products.");
    }

    // Usuwamy tylko konkretny plik, nie folder
    if (ingredient.image) {

      try {
        await deleteUpload(ingredient.image);
      } catch (err) {
        reportError(err, { area: "admin.ingredients" });
      }
    }

    await db.ingredient.delete({ where: { id } });

    revalidatePath("/dashboard/ingredients");
    return ok();

  } catch (error) {
    return failFrom(error, "INTERNAL", "Error during deletion.");
  }
}