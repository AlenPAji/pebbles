export type CartItem = {
  productId: string;
  variantId: string;
  name: string;
  colorName?: string;
  size: string;
  sku: string;
  price: number;
  quantity: number;
};
const key = "pebbles-cart-v2";
function valid(item: CartItem) {
  return (
    item &&
    typeof item.variantId === "string" &&
    !!item.variantId &&
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    typeof item.sku === "string" &&
    typeof item.size === "string" &&
    Number.isFinite(item.price) &&
    Number.isSafeInteger(item.quantity) &&
    item.quantity > 0
  );
}
export function readCart(storage: Storage): CartItem[] {
  try {
    const current = storage.getItem(key);
    if (current !== null) {
      const rows = JSON.parse(current);
      return Array.isArray(rows) ? rows.filter(valid) : [];
    }
    const old = JSON.parse(storage.getItem("pebbles-cart-item") || "null");
    const count = Number(storage.getItem("pebbles-cart-quantity"));
    const rows =
      old && valid({ ...old, quantity: count })
        ? [{ ...old, quantity: count }]
        : [];
    storage.setItem(key, JSON.stringify(rows));
    storage.removeItem("pebbles-cart-item");
    storage.removeItem("pebbles-cart-quantity");
    return rows;
  } catch {
    return [];
  }
}
export function mergeItem(items: CartItem[], item: CartItem) {
  if (!valid(item)) throw new Error("Invalid cart item");
  const previous = items.find((i) => i.variantId === item.variantId);
  if (!previous) return [...items, item];
  return items.map((i) =>
    i === previous
      ? { ...item, quantity: previous.quantity + item.quantity }
      : i,
  );
}
export function updateCart(update: (items: CartItem[]) => CartItem[]) {
  window.localStorage.setItem(
    key,
    JSON.stringify(update(readCart(window.localStorage)).filter(valid)),
  );
  window.dispatchEvent(new Event("pebbles-cart-updated"));
}
export function subtractPurchased(current: CartItem[], paid: CartItem[]) {
  return current
    .map((i) => ({
      ...i,
      quantity:
        i.quantity -
        (paid.find((p) => p.variantId === i.variantId)?.quantity ?? 0),
    }))
    .filter((i) => i.quantity > 0);
}
