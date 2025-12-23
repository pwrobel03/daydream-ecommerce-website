"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
}

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
    await checkAdmin();

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
      promoPrice: p.promoPrice ? Number(p.promoPrice) : null,
      images: p.images.map(img => ({ url: img.url }))
    }));

    return { products, totalCount };
  } catch (error) {
    console.error("INVENTORY_FETCH_ERROR:", error);
    return { products: [], totalCount: 0 };
  }
}

export async function deleteProduct(id: string) {
  try {
    await checkAdmin();
    
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

export async function upsertProduct(id: string, formData: FormData) {
  try {
    await checkAdmin();

    const isNew = id === "new";
    
    // Wyciąganie danych z FormData
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const promoPrice = formData.get("promoPrice") as string;
    const weight = formData.get("weight") as string;
    const stock = parseInt(formData.get("stock") as string);
    const statusId = formData.get("statusId") as string;
    
    const categoryIds = JSON.parse(formData.get("categoryIds") as string) as string[];
    const ingredientIds = JSON.parse(formData.get("ingredientIds") as string) as string[];
    const existingImages = JSON.parse(formData.get("existingImages") as string) as string[];
    const newImageFiles = formData.getAll("newImages") as File[];

    // 1. Zarządzanie plikami obrazów (usuwanie starych)
    if (!isNew) {
      const currentImages = await db.productImage.findMany({ where: { productId: id } });
      const imagesToDelete = currentImages.filter(img => !existingImages.includes(img.url));
      
      for (const img of imagesToDelete) {
        try {
          const filePath = path.join(process.cwd(), "public", img.url);
          await unlink(filePath);
        } catch (e) {
          console.error("Could not delete file:", img.url);
        }
      }
      
      await db.productImage.deleteMany({
        where: { url: { in: imagesToDelete.map(i => i.url) } }
      });
    }

    // 2. Zapisywanie nowych obrazów na dysku
    const uploadDir = path.join(process.cwd(), "public/products");
    await mkdir(uploadDir, { recursive: true });
    
    const newImageUrls: string[] = [];
    for (const file of newImageFiles) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      await writeFile(path.join(uploadDir, fileName), buffer);
      newImageUrls.push(`/products/${fileName}`);
    }

    // 3. Budowanie wspólnych danych relacyjnych
    const categoriesLogic = {
      set: categoryIds.map(id => ({ id }))
    };

    const ingredientsLogic = {
      set: ingredientIds.map(id => ({ id }))
    };

    const imagesLogic = {
      create: newImageUrls.map(url => ({ url }))
    };

    // 4. Wykonanie operacji Create lub Update
    if (isNew) {
      await db.product.create({
        data: {
          name,
          slug,
          description,
          price: parseFloat(price),
          promoPrice: promoPrice ? parseFloat(promoPrice) : null,
          weight,
          stock,
          // Przy create używamy tylko connect, jeśli statusId istnieje
          ...(statusId ? { status: { connect: { id: statusId } } } : {}),
          categories: { connect: categoryIds.map(id => ({ id })) },
          ingredients: { connect: ingredientIds.map(id => ({ id })) },
          images: imagesLogic,
        }
      });
    } else {
      await db.product.update({
        where: { id },
        data: {
          name,
          slug,
          description,
          price: parseFloat(price),
          promoPrice: promoPrice ? parseFloat(promoPrice) : null,
          weight,
          stock,
          // Przy update musimy obsłużyć connect LUB disconnect
          status: statusId 
            ? { connect: { id: statusId } } 
            : { disconnect: true },
          categories: categoriesLogic,
          ingredients: ingredientsLogic,
          images: imagesLogic,
        }
      });
    }

    revalidatePath("/dashboard/inventory");
    return { success: isNew ? "Artifact Forged" : "Essence Updated" };

  } catch (error: any) {
    console.error("UPSERT_ERROR:", error);
    return { error: error.message || "An unexpected error occurred" };
  }
}