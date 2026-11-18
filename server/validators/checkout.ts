import { field, InputError, optionalId, quantity } from "./catalog";

export type CheckoutLine = {
  productId: string;
  variantId: string;
  quantity: number;
  unitPaise?: number;
};
export function checkoutLines(raw: unknown): CheckoutLine[] {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 100)
    throw new InputError("Choose 1 to 100 cart lines");
  const result = new Map<string, CheckoutLine>();
  for (const item of raw) {
    const variantId = optionalId(item?.variantId)?.toLowerCase();
    const productId = optionalId(item?.productId)?.toLowerCase();
    const qty = quantity(item?.quantity);
    if (!productId || !variantId || !qty)
      throw new InputError("Invalid cart line");
    const unitPaise = item.unitPaise;
    if (
      unitPaise !== undefined &&
      (!Number.isSafeInteger(unitPaise) || unitPaise < 0)
    )
      throw new InputError("Invalid quoted price");
    const existing = result.get(variantId);
    if (
      existing &&
      (existing.productId !== productId || existing.unitPaise !== unitPaise)
    )
      throw new InputError("Variant has conflicting products");
    result.set(variantId, {
      productId,
      variantId,
      unitPaise,
      quantity: quantity(qty + (existing?.quantity ?? 0)),
    });
  }
  return Array.from(result.values()).sort((a, b) =>
    a.variantId.localeCompare(b.variantId),
  );
}
export function checkoutAddress(value: Record<string, unknown> | undefined) {
  return {
    recipientName: field(value?.recipientName, "recipient name", 255),
    phone: field(value?.phone, "phone", 30),
    addressLine1: field(value?.addressLine1, "address", 10000),
    city: field(value?.city, "city", 150),
    pincode: field(value?.pincode, "pincode", 20),
  };
}
export function paise(price: string) {
  const [whole, fraction = ""] = price.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export function rupees(value: number) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 999999999999)
    throw new InputError("Order amount is out of range");
  return Math.floor(value / 100) + "." + String(value % 100).padStart(2, "0");
}
