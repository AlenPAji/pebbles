import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { writeDb, type WriteTransaction } from "../db/transaction";
import {
  products,
  productColors,
  productVariants,
  productImages,
} from "../db/schema";
import { Conflict, heldQuantities, lockVariants } from "./inventory";
import type {
  BaseInput,
  ColorInput,
  VariantInput,
} from "../validators/catalog";

async function lockedProduct(
  tx: WriteTransaction,
  id: string,
  revision?: number,
) {
  const [product] = await tx
    .select()
    .from(products)
    .where(and(eq(products.id, id), isNull(products.deletedAt)))
    .for("no key update");
  if (!product) throw new Conflict("Product no longer available");
  if (revision !== undefined && product.revision !== revision)
    throw new Conflict("Product has changed. Reload before saving.");
  return product;
}

async function syncVariants(
  tx: WriteTransaction,
  productId: string,
  colorId: string,
  inputs: VariantInput[],
  legacy: boolean,
) {
  const rows = await tx
    .select()
    .from(productVariants)
    .where(eq(productVariants.productColorId, colorId));
  const held = await heldQuantities(
    tx,
    rows.map((v) => v.id),
  );
  const kept = new Set<string>();
  for (const v of inputs) {
    const row = v.id
      ? rows.find((r) => r.id === v.id && !r.deletedAt)
      : ((legacy
          ? rows.find(
              (r) =>
                !r.deletedAt && r.size.toLowerCase() === v.size.toLowerCase(),
            )
          : undefined) ??
        rows.find(
          (r) =>
            r.deletedAt &&
            r.size.trim().toLowerCase() === v.size.toLowerCase() &&
            r.sku.trim().toLowerCase() === v.sku.toLowerCase(),
        ));
    if (v.id && !row)
      throw new Conflict(
        "Variant does not belong to this colour or is archived",
      );
    if (row) {
      if (kept.has(row.id)) throw new Conflict("Duplicate variant");
      kept.add(row.id);
      const changingStock =
        v.originalStock === undefined || v.stockQuantity !== v.originalStock;
      if (
        changingStock &&
        v.originalStock !== undefined &&
        v.originalStock !== row.stockQuantity
      )
        throw new Conflict(
          "Stock changed during editing. Reload before changing this quantity.",
        );
      const stockQuantity = changingStock ? v.stockQuantity : row.stockQuantity;
      if (stockQuantity < (held.get(row.id) ?? 0))
        throw new Conflict("Stock is reserved for an open order");
      await tx
        .update(productVariants)
        .set({
          deletedAt: null,
          size: v.size,
          sku: v.sku,
          stockQuantity,
          priceOverride: legacy ? row.priceOverride : v.priceOverride,
        })
        .where(eq(productVariants.id, row.id));
    } else {
      await tx
        .insert(productVariants)
        .values({
          productId,
          productColorId: colorId,
          size: v.size,
          sku: v.sku,
          stockQuantity: v.stockQuantity,
          priceOverride: v.priceOverride,
        });
    }
  }
  const removed = rows.filter((v) => !v.deletedAt && !kept.has(v.id));
  if (removed.some((v) => held.has(v.id)))
    throw new Conflict("A selected variant is reserved for an open order");
  if (removed.length)
    await tx
      .update(productVariants)
      .set({ deletedAt: new Date() })
      .where(
        inArray(
          productVariants.id,
          removed.map((v) => v.id),
        ),
      );
}

async function lockProductStock(tx: WriteTransaction, id: string) {
  const rows = await tx
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.productId, id));
  const ids = rows.map((v) => v.id);
  await lockVariants(tx, ids);
  return ids;
}

export async function saveProduct(
  id: string,
  base: BaseInput,
  colors: ColorInput[],
  creating: boolean,
  revision?: number,
  legacy = false,
) {
  return writeDb.transaction(async (tx) => {
    const primary = colors[0];
    const values = { ...base, colorName: primary.name, colorHex: primary.hex };
    if (creating) await tx.insert(products).values({ ...values, id });
    else await lockedProduct(tx, id, revision);
    const allColors = await tx
      .select()
      .from(productColors)
      .where(eq(productColors.productId, id));
    const existing = allColors.filter((c) => !c.deletedAt);
    if (legacy && existing.length > 1)
      throw new Conflict("Reload the colour editor for this product");
    await lockProductStock(tx, id);
    await tx
      .update(productColors)
      .set({ isDefault: false })
      .where(eq(productColors.productId, id));
    const kept = new Set<string>();
    for (let index = 0; index < colors.length; index++) {
      const input = colors[index];
      const row = input.id
        ? existing.find((c) => c.id === input.id)
        : allColors.find(
            (c) =>
              c.deletedAt && c.code.toLowerCase() === input.code.toLowerCase(),
          );
      if (input.id && !row)
        throw new Conflict("Colour does not belong to this product");
      const colorValues = {
        deletedAt: null,
        name: input.name,
        hex: input.hex,
        isDefault: index === 0,
        sortOrder: index,
        updatedAt: new Date(),
      };
      const [color] = row
        ? await tx
            .update(productColors)
            .set(colorValues)
            .where(eq(productColors.id, row.id))
            .returning()
        : await tx
            .insert(productColors)
            .values({ ...colorValues, productId: id, code: input.code })
            .returning();
      kept.add(color.id);
      await syncVariants(tx, id, color.id, input.variants, legacy);
      // Temporarily archive the gallery inside this transaction so ordinal swaps are safe.
      const oldImages = await tx
        .update(productImages)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(productImages.productColorId, color.id),
            isNull(productImages.deletedAt),
          ),
        )
        .returning();
      for (let sortOrder = 0; sortOrder < input.images.length; sortOrder++) {
        const image = input.images[sortOrder];
        if (image.id) {
          if (
            !oldImages.some(
              (i) => i.id === image.id && i.imageUrl === image.imageUrl,
            )
          )
            throw new Conflict("Invalid retained image");
          await tx
            .update(productImages)
            .set({ deletedAt: null, sortOrder, altText: image.altText })
            .where(eq(productImages.id, image.id));
        } else
          await tx
            .insert(productImages)
            .values({
              productId: id,
              productColorId: color.id,
              ...image,
              sortOrder,
            });
      }
    }
    for (const color of existing.filter((c) => !kept.has(c.id))) {
      await syncVariants(tx, id, color.id, [], false);
      await tx
        .update(productImages)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(productImages.productColorId, color.id),
            isNull(productImages.deletedAt),
          ),
        );
      await tx
        .update(productColors)
        .set({ deletedAt: new Date() })
        .where(eq(productColors.id, color.id));
    }
    const [product] = await tx
      .update(products)
      .set({
        ...values,
        revision: sql`${products.revision}+1`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    return product;
  });
}

export async function setColorInventory(
  id: string,
  colorId: string | undefined,
  variants: VariantInput[],
  revision?: number,
) {
  return writeDb.transaction(async (tx) => {
    const p = await lockedProduct(tx, id, revision);
    const colors = await tx
      .select()
      .from(productColors)
      .where(
        and(eq(productColors.productId, id), isNull(productColors.deletedAt)),
      );
    const color = colorId
      ? colors.find((c) => c.id === colorId)
      : colors.length === 1
        ? colors[0]
        : undefined;
    if (!color)
      throw new Conflict("Choose an active colour belonging to this product");
    if (
      p.category?.toLowerCase() === "sarees" &&
      (variants.length !== 1 || variants[0].size !== "One Size")
    )
      throw new Conflict("Sarees require One Size");
    await lockProductStock(tx, id);
    await syncVariants(tx, id, color.id, variants, !colorId);
    await tx
      .update(products)
      .set({ revision: sql`${products.revision}+1`, updatedAt: new Date() })
      .where(eq(products.id, id));
    return tx
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productColorId, color.id),
          isNull(productVariants.deletedAt),
        ),
      );
  });
}

export async function archiveOrStockOut(id: string, archive: boolean) {
  return writeDb.transaction(async (tx) => {
    await lockedProduct(tx, id);
    const ids = await lockProductStock(tx, id);
    if ((await heldQuantities(tx, ids)).size)
      throw new Conflict("Stock is reserved for an open order");
    const changes = {
      revision: sql`${products.revision}+1`,
      updatedAt: new Date(),
    };
    await tx
      .update(products)
      .set(archive ? { ...changes, deletedAt: new Date() } : changes)
      .where(eq(products.id, id));
    if (archive) return { message: "Product archived" };
    return tx
      .update(productVariants)
      .set({ stockQuantity: 0 })
      .where(
        and(
          eq(productVariants.productId, id),
          isNull(productVariants.deletedAt),
        ),
      )
      .returning();
  });
}
