export const productCategories = [
  "Tops",
  "Sarees",
  "Kurtis",
  "2 Pcs Kurti Set",
  "3 Pcs Kurti Set",
  "Mul Chanderi",
  "Mul cotton",
  "Short Kurti",
  "Chikankari kurtis"
];

const categoryAliases = new Map([
  ["top", "Tops"],
  ["saree", "Sarees"],
  ["kurta", "Kurtis"],
  ["kurtas", "Kurtis"],
  ["kurti", "Kurtis"]
]);

export function normalizeProductCategory(value: string | null | undefined): string {
  const name = value?.trim() ?? "";
  const normalized = name.toLowerCase();
  return productCategories.find((category) => category.toLowerCase() === normalized)
    ?? categoryAliases.get(normalized)
    ?? name;
}

export function productCategoryFilterValues(value: string): string[] {
  const category = normalizeProductCategory(value);
  return [category.toLowerCase(), ...Array.from(categoryAliases)
    .filter(([, name]) => name === category)
    .map(([alias]) => alias)];
}

export function countProductCategories(categories: readonly (string | null)[]) {
  const counts = new Map(productCategories.map((category) => [category, 0]));
  for (const value of categories) {
    const category = normalizeProductCategory(value);
    if (category) counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return Array.from(counts, ([name, productCount]) => ({ name, productCount }));
}
