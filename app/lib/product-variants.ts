type ProductVariantDraft = {
  size: string;
  sku: string;
  stockQuantity: number;
};

const productSizes = ["M", "L", "XL", "XXL", "3XL"];

export function initializeProductVariants(variants: readonly ProductVariantDraft[] = [], isSaree = false): ProductVariantDraft[] {
  if (isSaree) {
    return [{
      size: "One Size",
      sku: variants[0]?.sku ?? "",
      stockQuantity: variants.reduce((total, variant) => total + Number(variant.stockQuantity), 0)
    }];
  }

  const savedVariants = new Map(variants
    .filter((variant) => variant.size !== "One Size")
    .map(({ size, sku, stockQuantity }) => [size, { size, sku, stockQuantity: Number(stockQuantity) }]));
  const sizes = Array.from(new Set([...productSizes, ...Array.from(savedVariants.keys())]));

  return sizes.map((size) => savedVariants.get(size) ?? { size, sku: "", stockQuantity: 0 });
}

export function prepareProductVariants(productSku: string, variants: readonly ProductVariantDraft[], isSaree: boolean): ProductVariantDraft[] {
  if (isSaree) {
    return [{ size: "One Size", sku: `${productSku.trim()}-ONE`, stockQuantity: variants[0]?.stockQuantity ?? 0 }];
  }

  return variants
    .filter((variant) => variant.sku.trim() || variant.stockQuantity > 0)
    .map((variant) => ({
      ...variant,
      sku: variant.sku.trim() || `${productSku.trim()}-${variant.size}`
    }));
}
