"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { errorMessage } from "@/lib/action-result";
import { ProductUpsertSchema } from "@/schemas";
import { deleteUpload, processAndStore } from "@/lib/uploads";
import { revalidatePath } from "next/cache";
import { reportError } from "@/lib/logger";


export async function getInventoryProducts({
  take = 5,
  skip = 0,
  search = "",
  categoryId,
  subCategoryId,
  stockStatus, // NOWOŚĆ: 'all' | 'low' | 'empty'
}: {
  take?: number;
  skip?: number;
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
  stockStatus?: string;
}) {
  try {
    await requireAdmin();

    const where = {
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
      
      // Filtrowanie po kategoriach (Many-to-Many)
      ...(subCategoryId 
        ? { categories: { some: { id: subCategoryId } } } 
        : categoryId 
        ? { categories: { some: { OR: [{ id: categoryId }, { parentId: categoryId }] } } } 
        : {}),

      // NOWOŚĆ: Filtrowanie po Stock
      ...(stockStatus === "low" ? { stock: { lte: 5, gt: 0 } } : {}),
      ...(stockStatus === "empty" ? { stock: 0 } : {}),
    };

    const rawProducts = await db.product.findMany({
      where,
      take,
      skip,
      include: {
        categories: { include: { parent: true } },
        status: true,
        images: { take: 1 }
      },
      orderBy: { createdAt: "desc" }
    });

    const totalCount = await db.product.count({ where });

    const products = rawProducts.map(p => ({
      ...p,
      price: Number(p.price),
      promoPrice: p.promoPrice !== null ? Number(p.promoPrice) : null,
      images: p.images.map(img => ({ url: img.url }))
    }));

    return { products, totalCount };
  } catch (error) {
    reportError(error, { area: "admin.inventory" });
    return { products: [], totalCount: 0 };
  }
}

// TODO: handle removing images connected with product
export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    
    await db.product.delete({ 
      where: { id } 
    });

    revalidatePath("/dashboard/inventory");
    return ok();
  } catch (error) {
    reportError(error, { area: "admin.inventory" });
    return failFrom(error, "INTERNAL", "Failed to delete product.");
  }
}


import crypto from "crypto";
import { ActionResult, fail, failFrom, ok } from "@/lib/action-result";

// FormData przenosi tablice jako JSON. Zły payload nie powinien wywalać akcji
// wyjątkiem — zwracamy pustą tablicę i pozwalamy zdecydować schematowi.
function parseJsonArray(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export async function upsertProduct(
  id: string,
  formData: FormData
): Promise<ActionResult<{ id: string; isNew: boolean }>> {
  try {
    await requireAdmin();

    const isNew = id === "new";

    // 1. Pobieranie i walidacja danych.
    // Pola tablicowe przychodzą jako JSON w FormData — parsujemy je defensywnie,
    // bo niepoprawny payload rzucał wyjątkiem przed jakąkolwiek walidacją.
    const parsed = ProductUpsertSchema.safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      price: formData.get("price"),
      promoPrice: formData.get("promoPrice") || null,
      weight: formData.get("weight"),
      stock: formData.get("stock"),
      statusId: formData.get("statusId"),
      categoryIds: parseJsonArray(formData.get("categoryIds")),
      ingredientIds: parseJsonArray(formData.get("ingredientIds")),
      existingImages: parseJsonArray(formData.get("existingImages")),
    });

    if (!parsed.success) {
      return fail("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Invalid product data.");
    }

    const {
      name, slug, description, price, promoPrice, weight, stock, statusId,
      categoryIds, ingredientIds, existingImages,
    } = parsed.data;

    // check if product with that name already exist
    const existingProduct = await db.product.findUnique({
      where: { slug }
    });
    if (existingProduct && (isNew || existingProduct.id !== id)) {
      return fail("CONFLICT", "A product with this name/slug already exists. Please choose a unique name.");
    }

    const newImageFiles = formData.getAll("newImages") as File[];

    // 2. Logika ID i Folderu
    let productId = id;
    if (isNew) {
      const tempProduct = await db.product.create({
        data: { name: "Temp", slug: `temp-${Date.now()}`, price: 0, stock: 0 }
      });
      productId = tempProduct.id;
    }

    // 3. Usuwanie starych zdjęć
    const currentImages = await db.productImage.findMany({ where: { productId } });
    const imagesToDelete = currentImages.filter(img => !existingImages.includes(img.url));
    
    for (const img of imagesToDelete) {
      await deleteUpload(img.url);
    }
    
    await db.productImage.deleteMany({
      where: { url: { in: imagesToDelete.map(i => i.url) } }
    });

    // 4. Przetwarzanie zdjęć przez SHARP
    const newImageUrls: string[] = [];
    
    for (const file of newImageFiles) {
      newImageUrls.push(
        await processAndStore(file, {
          dir: `products/${productId}`,
          fileName: crypto.randomUUID(),
          width: 1200,
          height: 1200,
        })
      );
    }

    // 5. Finalny Upsert
    const commonData = {
      name,
      slug,
      description,
      price,
      promoPrice: promoPrice ?? null,
      weight,
      stock,
      status: statusId ? { connect: { id: statusId } } : { disconnect: true },
      categories: { set: categoryIds.map(id => ({ id })) },
      ingredients: { set: ingredientIds.map(id => ({ id })) },
      images: {
        create: newImageUrls.map(url => ({ url }))
      },
    };

    await db.product.update({
      where: { id: productId },
      data: commonData
    });

    revalidatePath("/dashboard/inventory");
    return ok({ id: productId, isNew });

  } catch (error) {
    reportError(error, { area: "admin.inventory" });
    return failFrom(error, "INTERNAL", errorMessage(error, "Unexpected error"));
  }
}