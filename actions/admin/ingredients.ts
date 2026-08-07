"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import path from "path";
import { writeFile, unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";
import crypto from "crypto";
import sharp from "sharp";


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
    
    const baseDir = path.join(process.cwd(), "public", "ingredients");
    if (!existsSync(baseDir)) {
      await mkdir(baseDir, { recursive: true });
    }

    let imagePath: string | null | undefined = undefined;

    // 3. Procesowanie zdjęcia
    if (imageFile && imageFile.size > 0) {
      // Nazwa pliku to po prostu ID.webp - zawsze nadpisujemy lub tworzymy nowy
      const fileName = `${ingredientId}.webp`;
      const absolutePath = path.join(baseDir, fileName);

      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const optimized = await sharp(buffer)
        .resize(400, 400, { fit: 'cover' }) // Składniki są zazwyczaj ikonami/małymi fotkami
        .webp({ quality: 80 })
        .toBuffer();

      await writeFile(absolutePath, optimized);
      imagePath = `/ingredients/${fileName}`;
    } else if (removeExistingImage) {
      // Jeśli usuwamy zdjęcie, musimy usunąć plik fizyczny
      const current = !isNew ? await db.ingredient.findUnique({ where: { id } }) : null;
      if (current?.image) {
        try { await unlink(path.join(process.cwd(), "public", current.image)); } catch (e) {}
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

  } catch (error: any) {
    console.error("UPSERT_INGREDIENT_ERROR:", error);
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
      const absolutePath = path.join(process.cwd(), "public", ingredient.image);
      try {
        if (existsSync(absolutePath)) await unlink(absolutePath);
      } catch (err) {
        console.error("File delete error:", err);
      }
    }

    await db.ingredient.delete({ where: { id } });

    revalidatePath("/dashboard/ingredients");
    return { success: "Ingredient removed." };

  } catch (error: any) {
    return { error: "Error during deletion." };
  }
}