"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { deleteUpload, processAndStore } from "@/lib/uploads";
import { revalidatePath } from "next/cache";
import path from "path";
import crypto from "crypto";
import { reportError } from "@/lib/logger";


export async function upsertIngredient(id: string, formData: FormData) {
  try {
    await requireAdmin();

    const isNew = id === "new";
    const name = formData.get("name") as string;
    const imageFile = formData.get("image") as File | null;
    const removeExistingImage = formData.get("removeImage") === "true";

    // 1. Walidacja unikalności nazwy
    const existing = await db.ingredient.findFirst({ where: { name } });
    if (existing && (isNew || existing.id !== id)) {
      return { error: "Ingredient with this name already exists." };
    }

    // 2. Przygotowanie ID i katalogu głównego
    // Jeśli nowy, generujemy UUID od razu, zamiast tworzyć "Temp" w bazie
    const ingredientId = isNew ? crypto.randomUUID() : id;
    

    let imagePath: string | null | undefined = undefined;

    // 3. Procesowanie zdjęcia
    if (imageFile && imageFile.size > 0) {
      // Nazwa pliku to po prostu ID.webp - zawsze nadpisujemy lub tworzymy nowy
      // Składniki są zazwyczaj ikonami, więc kadrujemy do kwadratu.
      imagePath = await processAndStore(imageFile, {
        dir: "ingredients",
        fileName: ingredientId,
        width: 400,
        height: 400,
        fit: "cover",
      });
    } else if (removeExistingImage) {
      // Jeśli usuwamy zdjęcie, musimy usunąć plik fizyczny
      const current = !isNew ? await db.ingredient.findUnique({ where: { id } }) : null;
      if (current?.image) {
        await deleteUpload(current.image);
      }
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

    revalidatePath("/dashboard/ingredients");
    return { success: "Ingredient saved successfully!" };

  } catch (error) {
    reportError(error, { area: "admin.ingredients" });
    return { error: "Failed to save ingredient." };
  }
}

export async function deleteIngredient(id: string) {
  try {
    await requireAdmin();

    const ingredient = await db.ingredient.findUnique({
      where: { id },
      include: { products: true }
    });

    if (!ingredient) return { error: "Ingredient not found." };
    if (ingredient.products.length > 0) {
      return { error: "Cannot delete: ingredient is used in products." };
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
    return { success: "Ingredient removed." };

  } catch (error) {
    return { error: "Error during deletion." };
  }
}