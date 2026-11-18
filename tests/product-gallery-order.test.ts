import assert from "node:assert/strict";
import { test } from "node:test";
import { orderGallery } from "../server/validators/catalog";

test("new uploads can replace the primary image and interleave with retained IDs", () => {
  const images = ["saved-a", "saved-b", "replacement", "new"];
  assert.deepEqual(orderGallery(images, [2, 0, 3, 1]), ["replacement", "saved-a", "new", "saved-b"]);
  assert.deepEqual(orderGallery(images, undefined), images);
});

test("invalid orders cannot omit, duplicate or invent images", () => {
  for (const order of [[0], [0, 0], [0, 2], [-1, 1], ["0", 1], null]) {
    assert.throws(() => orderGallery(["a", "b"], order), /Invalid gallery/);
  }
});
