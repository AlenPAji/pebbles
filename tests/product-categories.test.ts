import assert from "node:assert/strict";
import { test } from "node:test";

import { countProductCategories, normalizeProductCategory, productCategories, productCategoryFilterValues } from "../app/lib/product-categories";

test("existing kurta categories are shown as Kurtis without losing product counts", () => {
  const categories = countProductCategories(["Kurtas", " kurta ", "KURTIS", "Tops", null, ""]);
  assert.deepEqual(categories.find((category) => category.name === "Kurtis"), { name: "Kurtis", productCount: 3 });
  assert.equal(categories.some((category) => category.name === "Kurtas"), false);
  assert.equal(categories.find((category) => category.name === "Short Kurti")?.productCount, 0);
});

test("old and new category links match the same stored product values", () => {
  assert.deepEqual(productCategoryFilterValues("Kurtas"), productCategoryFilterValues("Kurtis"));
  assert(productCategoryFilterValues("Kurtis").includes("kurtas"));
  assert(productCategoryFilterValues("Kurtis").includes("kurtis"));
  assert.deepEqual(productCategoryFilterValues("2 Pcs Kurti Set"), ["2 pcs kurti set"]);
});

test("category labels keep their requested spelling and order", () => {
  assert.equal(normalizeProductCategory(" mul COTTON "), "Mul cotton");
  assert.equal(normalizeProductCategory("3 PCS KURTI SET"), "3 Pcs Kurti Set");
  assert.equal(productCategories.filter((category) => category === "Kurtis").length, 1);
  assert.deepEqual(countProductCategories([]).map((category) => category.name), productCategories);
});
