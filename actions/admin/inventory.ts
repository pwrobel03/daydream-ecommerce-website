"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/guards";
import { ProductUpsertSchema } from "@/schemas";
import { revalidatePath } from "next/cache";


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
    console.error("INVENTORY_FETCH_ERROR:", error);
    return { products: [], totalCount: 0 };
  }
}

// TODO: handle removing images connected with product
export async function deleteProduct(id: string) {
  try {
    await requireAdmin();
    
    await db.product.delete({ 
      where: { id } 
    });

    revalidatePath("/dashboard/inventory");
    return { success: "Product removed from the dreamscape." };
  } catch (error) {
    console.error("DELETE_PRODUCT_ERROR:", error);
    return { error: "Failed to delete product." };
  }
}


import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import crypto from "crypto";
import sharp from "sharp"; // Importujemy sharp

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

export async function upsertProduct(id: string, formData: FormData) {
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
      return { error: parsed.error.issues[0]?.message ?? "Invalid product data." };
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
      return { error: "A product with this name/slug already exists. Please choose a unique name." };
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

    const productDir = `/products/${productId}`;
    const absoluteUploadDir = path.join(process.cwd(), "public", productDir);

    if (!existsSync(absoluteUploadDir)) {
      await mkdir(absoluteUploadDir, { recursive: true });
    }

    // 3. Usuwanie starych zdjęć
    const currentImages = await db.productImage.findMany({ where: { productId } });
    const imagesToDelete = currentImages.filter(img => !existingImages.includes(img.url));
    
    for (const img of imagesToDelete) {
      try {
        await unlink(path.join(process.cwd(), "public", img.url));
      } catch (e) {
        console.error("Delete error:", img.url);
      }
    }
    
    await db.productImage.deleteMany({
      where: { url: { in: imagesToDelete.map(i => i.url) } }
    });

    // 4. Przetwarzanie zdjęć przez SHARP
    const newImageUrls: string[] = [];
    
    for (const file of newImageFiles) {
      const fileName = `${crypto.randomUUID()}.webp`; // Zawsze .webp
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Optymalizacja: zmiana rozmiaru i konwersja
      const optimizedBuffer = await sharp(buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 }) // Balans między jakością a rozmiarem
        .toBuffer();

      await writeFile(path.join(absoluteUploadDir, fileName), optimizedBuffer);
      newImageUrls.push(`${productDir}/${fileName}`);
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
    return { success: isNew ? "Artifact Forged" : "Essence Updated", id: productId };

  } catch (error: any) {
    console.error("UPSERT_ERROR:", error);
    return { error: error.message || "Unexpected error" };
  }
}