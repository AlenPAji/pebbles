import {chooseColor, chooseSize} from "../app/lib/catalog-selection";
import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeItem, readCart, subtractPurchased } from "../app/lib/cart";
import { checkoutLines, paise, rupees } from "../server/validators/checkout";
import { parseVariants, validateColors } from "../server/validators/catalog";
import { validSignature } from "../server/services/razorpay";
import { createHmac, randomUUID } from "node:crypto";

const item = {
  productId: randomUUID(),
  variantId: randomUUID(),
  name: "Kurti",
  size: "M",
  colorName: "Rose",
  sku: "K-R-M",
  price: 10.1,
  quantity: 2,
};
test("cart merges only identical variant IDs and payment subtracts just the submitted quantities", () => {
  const blue = {
    ...item,
    variantId: randomUUID(),
    colorName: "Blue",
    sku: "K-B-M",
  };
  const bag = mergeItem(mergeItem([item], blue), item);
  assert.deepEqual(
    bag.map((i) => i.quantity),
    [4, 2],
  );
  assert.deepEqual(subtractPurchased(bag, [item]), [
    { ...item, quantity: 2 },
    blue,
  ]);
});
test("legacy cart uses its quantity and a removed legacy item stays removed", () => {
  for (const count of [0, 4]) {
    const values = new Map([
      ["pebbles-cart-item", JSON.stringify(item)],
      ["pebbles-cart-quantity", String(count)],
    ]);
    const storage = {
      getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => values.set(k, v),
      removeItem: (k: string) => values.delete(k),
    } as unknown as Storage;
    assert.equal(readCart(storage)[0]?.quantity ?? 0, count);
    assert.equal(values.has("pebbles-cart-item"), false);
    assert.equal(readCart(storage)[0]?.quantity ?? 0, count);
  }
});
test("checkout consolidates repeated lines and rejects conflicting products, prices and quantities", () => {
  assert.equal(checkoutLines([item, item])[0].quantity, 4);
  assert.throws(() =>
    checkoutLines([item, { ...item, productId: randomUUID() }]),
  );
  assert.throws(() => checkoutLines([item, { ...item, unitPaise: 202 }]));
  for (const quantity of [0, -1, 1.5, 2147483648])
    assert.throws(() => checkoutLines([{ ...item, quantity }]));
  assert.equal(rupees(paise("13.09") * 3), "39.27");
});
test("colour sizes, sale SKU and override validation", () => {
  const v = { size: "M", sku: "AA", stockQuantity: 0, priceOverride: "0.00" };
  const c = {
    code: "red",
    name: "Red",
    hex: "#EE1122",
    images: [],
    variants: parseVariants([v]),
  };
  assert.equal(c.variants[0].priceOverride, "0.00");
  assert.throws(() => parseVariants([v, { ...v, size: " m " }]));
  assert.throws(() => parseVariants([{ ...v, priceOverride: "-1" }]));
  assert.throws(() => validateColors([c, { ...c, code: "blue" }], "Tops"));
  assert.throws(() => validateColors([c], "Sarees"));
});
test("webhook signature binds the exact body and its separate signing secret", () => {
  const body = '{"event":"payment.captured"}',
    secret = "fixture-secret";
  const signature = createHmac("sha256", secret).update(body).digest("hex");
  assert(validSignature(body, signature, secret));
  assert(!validSignature(body + " ", signature, secret));
  assert(!validSignature(body, signature, "another-secret"));
  assert(!validSignature(body, "bad", secret));
});
test("a filtered card and its detail select the same in-stock colour, gallery, size and price", () => {
  const variant = {size:"M", stockQuantity:0, priceOverride:null};
  const colors: Array<{id:string;name:string;gallery:string;variants:Array<{size:string;stockQuantity:number;priceOverride:string|null}>}> = [
    {id:"red",name:"Red",gallery:"red.jpg",variants:[variant]},
    {id:"blue",name:"Blue",gallery:"blue.jpg",variants:[{...variant,stockQuantity:2,priceOverride:"12.10"}]}
  ];
  const card=chooseColor(colors,undefined,"m");
  const detail=chooseColor(colors,card.id,"M");
  assert.equal(detail.gallery,"blue.jpg");
  assert.equal(chooseSize(detail.variants,"M")?.priceOverride,"12.10");
  assert.equal(chooseSize(chooseColor(colors,"Red").variants),undefined);
});
