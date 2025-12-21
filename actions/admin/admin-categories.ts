"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { writeFile } from "fs/promises";
import path from "path";

async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
}

export async function createCategory(formData: FormData) {
  try {
    await checkAdmin();

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const parentId = formData.get("parentId") as string;
    const imageFile = formData.get("image") as File;

    let imagePath = "";

    // Logika zapisu pliku w /public/uploads
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const fileName = `${Date.now()}-${imageFile.name}`;
      const filePath = path.join(process.cwd(), "public/categories", fileName);
      
      await writeFile(filePath, buffer);
      imagePath = `/categories/${fileName}`;
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
    return { success: "Category added to the dreamscape." };
  } catch (error) {
    console.error(error);
    return { error: "Failed to create category." };
  }
}

export async function getCategories() {
  try {
    await checkAdmin();
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
    await checkAdmin();
    // Możesz tu dodać sprawdzenie, czy kategoria nie ma przypisanych produktów
    await db.category.delete({ where: { id } });
    revalidatePath("/dashboard/categories");
    return { success: "Category removed." };
  } catch (error) {
    return { error: "Failed to delete category." };
  }
}