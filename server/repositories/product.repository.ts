import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "../db";
import { productImages, products } from "../db/schema";

export type ProductInput = {
  sku: string;
  name: string;
  description: string;
  category: string;
  price: string;
  stockQuantity: number;
};

export async function listProducts() {
  return db.select().from(products).orderBy(asc(products.createdAt));
}

export async function findProduct(id: string) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return null;
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id))
    .orderBy(asc(productImages.sortOrder));
  return { ...product, images };
}

export async function createProduct(input: ProductInput, images: Array<{ imageUrl: string; altText: string; sortOrder: number }>) {
  return db.transaction(async (transaction) => {
    const [product] = await transaction.insert(products).values(input).returning();
    if (images.length) {
      await transaction.insert(productImages).values(images.map((image) => ({ ...image, productId: product.id })));
    }
    return product;
  });
}

export async function updateProduct(id: string, input: ProductInput, images: Array<{ imageUrl: string; altText: string; sortOrder: number }>) {
  return db.transaction(async (transaction) => {
    const [product] = await transaction.update(products).set({ ...input, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    if (!product) return null;
    await transaction.delete(productImages).where(eq(productImages.productId, id));
    if (images.length) {
      await transaction.insert(productImages).values(images.map((image) => ({ ...image, productId: id })));
    }
    return product;
  });
}

export async function deleteProduct(id: string) {
  const [product] = await db.delete(products).where(eq(products.id, id)).returning();
  return product ?? null;
}
