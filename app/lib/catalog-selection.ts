type Choice = { size: string; stockQuantity: number; priceOverride: string | null };
type Swatch = { id: string; name: string; variants: Choice[] };

export function chooseColor<T extends Swatch>(colors: T[], color?: string, size?: string) {
  const name = color?.trim().toLowerCase();
  const wanted = size?.trim().toLowerCase();
  const candidates = name ? colors.filter(c => c.id === color || c.name.trim().toLowerCase() === name) : colors;
  return candidates.find(c => c.variants.some(v => v.stockQuantity > 0 && (!wanted || v.size.trim().toLowerCase() === wanted)))
    ?? candidates[0] ?? colors[0];
}

export function chooseSize<T extends Choice>(variants: T[], size?: string) {
  const wanted = size?.trim().toLowerCase();
  return variants.find(v => v.stockQuantity > 0 && v.size.trim().toLowerCase() === wanted)
    ?? variants.find(v => v.stockQuantity > 0);
}
