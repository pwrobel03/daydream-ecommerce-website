"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { saveUpload } from "@/lib/uploads";
import { revalidatePath } from "next/cache";
import slugify from "slugify";

const MAX_FILE_SIZE = 8 * 1024 * 1024; 

export async function createCategory(formData: FormData) {
  try {
    await requireAdmin();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const parentId = formData.get("parentId") as string;
    const imageFile = formData.get("image") as File;

    let imagePath = "";

    if (imageFile && imageFile.size > 0) {
      // --- TUTAJ OBSŁUŻENIE TWOJEGO PROBLEMU ---
      if (imageFile.size > MAX_FILE_SIZE) {
        return { error: "The dream image is too heavy. Maximum limit is 8MB." };
      }

      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      


      const fileName = `${Date.now()}-${slugify(imageFile.name, { lower: true })}`;
      imagePath = await saveUpload("categories", fileName, buffer);
    }

    const slug = slugify(name, { lower: true, strict: true });

    await db.category.create({
      data: {
        name,
        slug,
        description,
        image: imagePath,
        parentId: parentId || null,
      }
    });

    revalidatePath("/dashboard/categories");
    return { success: "Category forged successfully!" };

  } catch (error) {
    console.error("CRITICAL_SERVER_ERROR:", error);
    // Zwracamy obiekt błędu zamiast rzucać wyjątek, by klient nie utknął
    return { error: "A server glitch occurred. Please try again later." };
  }
}

export async function getCategories() {
  try {
    await requireAdmin();
    return await db.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true } }
      }
    });
  } catch (error) {
    return [];
  }
}

export async function deleteCategory(id: string) {
  try {
    await requireAdmin();
    // Możesz tu dodać sprawdzenie, czy kategoria nie ma przypisanych produktów
    await db.category.delete({ where: { id } });
    revalidatePath("/dashboard/categories");
    return { success: "Category removed." };
  } catch (error) {
    return { error: "Failed to delete category." };
  }
}