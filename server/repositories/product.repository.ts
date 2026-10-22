import "server-only";

import { and, asc, count, desc, eq, sql } from "drizzle-orm";

import { db } from "../db";
import { productImages, products } from "../db/schema";
import { getProductImageUrl } from "../storage";

export type ProductInput = {
  sku: string;
  name: string;
  description: string;
  category: string;
  price: string;
  stockQuantity: number;
};

export type StoreProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  images: Array<{ imageUrl: string; altText: string | null; sortOrder: number }>;
};

async function withImageUrls(product: typeof products.$inferSelect): Promise<StoreProduct> {
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.sortOrder));
  const imagesWithUrls = await Promise.all(images.map(async (image) => ({
    ...image,
    imageUrl: await getProductImageUrl(image.imageUrl)
  })));
  return {
    id: product.id,
    name: product.name,
    category: product.category ?? "Uncategorized",
    price: Number(product.price),
    description: product.description,
    image: imagesWithUrls[0]?.imageUrl ?? "",
    images: imagesWithUrls
  };
}

export async function listStoreProducts(options: { category?: string; query?: string; page?: number; pageSize?: number } = {}) {
  const pageSize = options.pageSize ?? 9;
  const page = Math.max(1, options.page ?? 1);
  const filters = [];
  if (options.category) filters.push(eq(products.category, options.category));
  if (options.query) filters.push(sql`lower(${products.name}) like ${`%${options.query.toLowerCase()}%`}`);
  const where = filters.length ? and(...filters) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(products).where(where).orderBy(desc(products.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: count() }).from(products).where(where)
  ]);
  return {
    products: await Promise.all(rows.map(withImageUrls)),
    total: Number(total),
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(Number(total) / pageSize))
  };
}

export async function findStoreProduct(id: string) {
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return product ? withImageUrls(product) : null;
}

export async function listProducts() {
  const productRows = await db.select().from(products).orderBy(asc(products.createdAt));
  return Promise.all(productRows.map(async (product) => {
    const [image] = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(asc(productImages.sortOrder))
      .limit(1);
    return {
      ...product,
      primaryImageUrl: image ? await getProductImageUrl(image.imageUrl) : null
    };
  }));
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
  const [product] = await db.insert(products).values(input).returning();
  if (images.length) {
    await db.insert(productImages).values(images.map((image) => ({ ...image, productId: product.id })));
  }
  return product;
}

export async function updateProduct(id: string, input: ProductInput, images: Array<{ imageUrl: string; altText: string; sortOrder: number }>) {
  const [product] = await db.update(products).set({ ...input, updatedAt: new Date() }).where(eq(products.id, id)).returning();
  if (!product) return null;
  await db.delete(productImages).where(eq(productImages.productId, id));
  if (images.length) {
    await db.insert(productImages).values(images.map((image) => ({ ...image, productId: id })));
  }
  return product;
}

export async function deleteProduct(id: string) {
  const [product] = await db.delete(products).where(eq(products.id, id)).returning();
  return product ?? null;
}
