"use server";

import { db } from "@/lib/db";
import { requireAdmin, requireBackOffice } from "@/lib/guards";
import { processAndStore } from "@/lib/uploads";
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { reportError } from "@/lib/logger";
import { ActionResult, fail, failFrom, ok } from "@/lib/action-result";

const MAX_FILE_SIZE = 8 * 1024 * 1024; 

export async function createCategory(formData: FormData): Promise<ActionResult> {
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
        return fail("INVALID_INPUT", "The dream image is too heavy. Maximum limit is 8MB.");
      }

      // Ta ścieżka wcześniej zapisywała surowy bufor bez sharp — teraz
      // przechodzi przez to samo przetwarzanie co pozostałe uploady.
      imagePath = await processAndStore(imageFile, {
        dir: "categories",
        fileName: `${Date.now()}-${slugify(imageFile.name, { lower: true, strict: true })}`,
        width: 800,
        height: 800,
      });
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
    return ok();

  } catch (error) {
    reportError(error, { area: "admin.categories" });
    // Zwracamy obiekt błędu zamiast rzucać wyjątek, by klient nie utknął
    return failFrom(error, "INTERNAL", "A server glitch occurred. Please try again later.");
  }
}

export async function getCategories() {
  try {
    await requireBackOffice();
    return await db.category.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        description: true,
        parentId: true,
        _count: { select: { products: true } },
      },
    });
  } catch {
    return [];
  }
}

export type AdminCategory = Awaited<ReturnType<typeof getCategories>>[number];

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    // Możesz tu dodać sprawdzenie, czy kategoria nie ma przypisanych produktów
    await db.category.delete({ where: { id } });
    revalidatePath("/dashboard/categories");
    return ok();
  } catch (error) {
    return failFrom(error, "INTERNAL", "Failed to delete category.");
  }
}