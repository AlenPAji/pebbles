import assert from "node:assert/strict";
import { test } from "node:test";

import { initializeProductVariants, prepareProductVariants } from "../app/lib/product-variants";

test("editing a product shows unused sizes at zero alongside saved stock", () => {
  assert.deepEqual(initializeProductVariants([
    { size: "L", sku: "PB-100-L", stockQuantity: 3 },
    { size: "M", sku: "CUSTOM-M", stockQuantity: 4 }
  ]), [
    { size: "M", sku: "CUSTOM-M", stockQuantity: 4 },
    { size: "L", sku: "PB-100-L", stockQuantity: 3 },
    { size: "XL", sku: "", stockQuantity: 0 },
    { size: "XXL", sku: "", stockQuantity: 0 },
    { size: "3XL", sku: "", stockQuantity: 0 }
  ]);
});

test("a size omitted during creation can be stocked on a later edit", () => {
  const original = [
    { size: "M", sku: "CUSTOM-M", stockQuantity: 4 },
    { size: "L", sku: "PB-100-L", stockQuantity: 3 }
  ];
  const edited = initializeProductVariants(original).map((variant) =>
    variant.size === "XL" ? { ...variant, stockQuantity: 6 } : variant
  );
  const submitted = prepareProductVariants("PB-100", edited, false);

  assert.deepEqual(submitted, [
    ...original,
    { size: "XL", sku: "PB-100-XL", stockQuantity: 6 }
  ]);
  assert.equal(initializeProductVariants(submitted).find((variant) => variant.size === "XL")?.stockQuantity, 6);
  assert.equal(initializeProductVariants(submitted).find((variant) => variant.size === "XXL")?.stockQuantity, 0);
});

test("existing sizes outside the standard list remain editable", () => {
  const variants = initializeProductVariants([{ size: "S", sku: "CUSTOM-S", stockQuantity: 2 }]);
  assert.deepEqual(variants.map((variant) => variant.size), ["M", "L", "XL", "XXL", "3XL", "S"]);
  assert.deepEqual(variants.at(-1), { size: "S", sku: "CUSTOM-S", stockQuantity: 2 });
});

test("the saree editor keeps a single stock row", () => {
  assert.deepEqual(initializeProductVariants([
    { size: "One Size", sku: "PB-100-ONE", stockQuantity: 8 }
  ], true), [{ size: "One Size", sku: "PB-100-ONE", stockQuantity: 8 }]);
  assert.equal(initializeProductVariants().length, 5);
});

test("creating a product retains stock entered without individual size SKUs", () => {
  const variants = [
    { size: "M", sku: "", stockQuantity: 5 },
    { size: "L", sku: "", stockQuantity: 3 },
    { size: "XL", sku: "", stockQuantity: 2 },
    { size: "XXL", sku: "", stockQuantity: 0 },
    { size: "3XL", sku: "", stockQuantity: 0 }
  ];

  assert.deepEqual(prepareProductVariants("PB-100", variants, false), [
    { size: "M", sku: "PB-100-M", stockQuantity: 5 },
    { size: "L", sku: "PB-100-L", stockQuantity: 3 },
    { size: "XL", sku: "PB-100-XL", stockQuantity: 2 }
  ]);
});

test("custom size SKUs are preserved alongside generated SKUs", () => {
  assert.deepEqual(prepareProductVariants(" PB-100 ", [
    { size: "M", sku: " ", stockQuantity: 4 },
    { size: "L", sku: " CUSTOM-L ", stockQuantity: 6 }
  ], false), [
    { size: "M", sku: "PB-100-M", stockQuantity: 4 },
    { size: "L", sku: "CUSTOM-L", stockQuantity: 6 }
  ]);
});

test("configured sizes can be sold out while unused sizes are omitted", () => {
  assert.deepEqual(prepareProductVariants("PB-100", [
    { size: "M", sku: "PB-100-M", stockQuantity: 0 },
    { size: "L", sku: "", stockQuantity: 0 }
  ], false), [
    { size: "M", sku: "PB-100-M", stockQuantity: 0 }
  ]);
});

test("editing a product preserves its existing size SKUs and updated stock", () => {
  const variants = [
    { size: "M", sku: "ORIGINAL-M", stockQuantity: 7 },
    { size: "XL", sku: "ORIGINAL-XL", stockQuantity: 1 }
  ];
  assert.deepEqual(prepareProductVariants("PB-100", variants, false), variants);
});

test("sarees retain their single stock quantity", () => {
  assert.deepEqual(prepareProductVariants(" PB-100 ", [
    { size: "One Size", sku: "", stockQuantity: 8 }
  ], true), [
    { size: "One Size", sku: "PB-100-ONE", stockQuantity: 8 }
  ]);
});
