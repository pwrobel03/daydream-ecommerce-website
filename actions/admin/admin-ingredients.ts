// actions/admin/ingredients.ts
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import path from "path";
import { writeFile, unlink, mkdir, rm } from "fs/promises";
import { existsSync } from "fs";
import crypto from "crypto";
import sharp from "sharp";

async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
}

export async function upsertIngredient(id: string, formData: FormData) {
  try {
    await checkAdmin();

    const isNew = id === "new";
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const imageFile = formData.get("image") as File | null;
    const removeExistingImage = formData.get("removeImage") === "true";

    // 1. Walidacja unikalności nazwy
    const existing = await db.ingredient.findFirst({ where: { name } });
    if (existing && (isNew || existing.id !== id)) {
      return { error: "Ingredient with this name already exists." };
    }

    // 2. Obsługa ID i folderu
    let ingredientId = id;
    if (isNew) {
      const temp = await db.ingredient.create({ data: { name: "Temp" } });
      ingredientId = temp.id;
    }

    const ingredientDir = `/ingredients/${ingredientId}`;
    const absoluteDir = path.join(process.cwd(), "public", ingredientDir);

    if (!existsSync(absoluteDir)) {
      await mkdir(absoluteDir, { recursive: true });
    }

    let image: string | null | undefined = undefined; // undefined oznacza "nie zmieniaj"

    // 3. Procesowanie zdjęcia
    if (imageFile && imageFile.size > 0) {
      // Usuwamy stary folder/pliki przed wgraniem nowego
      const current = await db.ingredient.findUnique({ where: { id: ingredientId } });
      if (current?.image) {
        try { await unlink(path.join(process.cwd(), "public", current.image)); } catch (e) {}
      }

      const fileName = `${crypto.randomUUID()}.webp`;
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const optimized = await sharp(buffer)
        .resize(600, 600, { fit: 'cover' }) // Składniki są zazwyczaj małe
        .webp({ quality: 85 })
        .toBuffer();

      await writeFile(path.join(absoluteDir, fileName), optimized);
      image = `${ingredientDir}/${fileName}`;
    } else if (removeExistingImage) {
      image = null; // Użytkownik chce usunąć zdjęcie i użyć placeholdera
    }

    // 4. Update bazy
    await db.ingredient.update({
      where: { id: ingredientId },
      data: {
        name,
        ...(image !== undefined && { image })
      }
    });

    revalidatePath("/dashboard/ingredients");
    return { success: isNew ? "Ingredient created successfully!" : "Ingredient updated successfully!" };

  } catch (error: any) {
    return { error: "Invalid error!" };
  }
}

export async function deleteIngredient(id: string) {
  try {
    // 1. Weryfikacja uprawnień
    await checkAdmin();

    // 2. Pobranie danych składnika, aby sprawdzić czy istnieje
    const ingredient = await db.ingredient.findUnique({
      where: { id },
      include: {
        products: true, // Sprawdzamy, czy składnik jest używany w produktach
      },
    });

    if (!ingredient) {
      return { error: "Ingredient not found." };
    }

    if (ingredient.products.length > 0) {
      return { 
        error: `You cannot delete this ingredient because it's used in${ingredient.products.length} products.` 
      };
    }

    const ingredientDir = path.join(process.cwd(), "public", "ingredients", id);

    if (existsSync(ingredientDir)) {
      try {
        await rm(ingredientDir, { recursive: true, force: true });
      } catch (err) {
        console.error("Error during delete ingredient image removal.", err);
      }
    }

    await db.ingredient.delete({
      where: { id },
    });

    // 6. Odświeżenie widoków
    revalidatePath("/dashboard/ingredients");
    revalidatePath("/dashboard/inventory"); // Produkty mogą wyświetlać składniki

    return { success: "Ingredient removed successfully." };

  } catch (error: any) {
    console.error("DELETE_INGREDIENT_ERROR:", error);
    return { error: "Wystąpił błąd podczas usuwania składnika." };
  }
}