import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { findProduct } from "../repositories/product.repository";
import { saveProduct } from "../repositories/catalog-write";
import { Conflict } from "../repositories/inventory";
import { uploadProductImage } from "../storage";
import {
  field,
  InputError,
  optionalId,
  orderGallery,
  parseBase,
  parseVariants,
  quantity,
  validateColors,
  type ColorInput,
} from "../validators/catalog";

export function catalogError(error: unknown) {
  if (
    error instanceof Conflict ||
    error instanceof InputError ||
    error instanceof SyntaxError
  )
    return NextResponse.json(
      { error: error.message },
      { status: error instanceof Conflict ? 409 : 400 },
    );
  const cause = (error as { cause?: { code?: string } })?.cause;
  if (cause?.code === "23505")
    return NextResponse.json(
      { error: "SKU, colour code or size is already in use" },
      { status: 409 },
    );
  if (error instanceof Error && error.message.startsWith("Neon Object Storage"))
    return NextResponse.json({ error: error.message }, { status: 502 });
  console.error("Catalogue operation failed", cause?.code);
  return NextResponse.json(
    { error: "Unable to save catalogue changes" },
    { status: 500 },
  );
}
export async function handleProductForm(request: Request, productId?: string) {
  try {
    const form = await request.formData();
    const product = productId ? await findProduct(productId) : null;
    if (productId && !product)
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const id = productId ?? randomUUID();
    const base = parseBase(form);
    const legacy = !form.has("colors");
    if (legacy && product && product.colors.length > 1)
      throw new Conflict("Reload the colour editor");
    const raw: unknown = legacy
      ? [
          {
            id: product?.colors[0]?.id,
            code: product?.colors[0]?.code ?? "default",
            name: form.get("colorName"),
            hex: form.get("colorHex"),
            variants: JSON.parse(String(form.get("variants"))),
            images: JSON.parse(String(form.get("retainedImages") ?? "[]")),
          },
        ]
      : JSON.parse(String(form.get("colors")));
    if (!Array.isArray(raw)) throw new InputError("Invalid colours");
    const uploads: { file: File; key: string }[] = [];
    const colors: ColorInput[] = raw.map((c, index) => {
      if (!c || !Array.isArray(c.images))
        throw new InputError("Invalid gallery");
      const colorId = optionalId(c.id);
      const old = colorId
        ? product?.colors.find((row) => row.id === colorId)
        : undefined;
      if (colorId && !old) throw new Conflict("Unknown colour");
      const code = old?.code ?? field(c.code, "colour code", 100);
      const images = c.images.map(
        (image: { id?: string; imageUrl?: string }) => {
          const saved = old?.images.find((i) =>
            legacy ? i.imageUrl === image.imageUrl : i.id === image.id,
          );
          if (!saved) throw new InputError("Invalid retained image");
          return {
            id: saved.id,
            imageUrl: saved.imageUrl,
            altText: saved.altText,
          };
        },
      );
      for (const file of form.getAll(legacy ? "images" : "images." + index)) {
        if (
          typeof file === "string" ||
          !file.type.startsWith("image/") ||
          file.size > 5 * 1024 * 1024 ||
          !file.size
        )
          throw new InputError("Choose image files up to 5 MB");
        const key =
          id +
          "/" +
          encodeURIComponent(code) +
          "/" +
          randomUUID() +
          "-" +
          file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        images.push({ imageUrl: key, altText: file.name });
        uploads.push({ file, key });
      }
      return {
        id: colorId,
        code,
        name: field(c.name, "colour name", 100),
        hex: c.hex ? field(c.hex, "colour hex", 7) : null,
        variants: parseVariants(c.variants),
        images: orderGallery(images, c.imageOrder),
      };
    });
    validateColors(colors, base.category);
    const revision = product
      ? legacy
        ? product.revision
        : quantity(JSON.parse(String(form.get("revision"))))
      : undefined;
    for (const { file, key } of uploads)
      await uploadProductImage(
        key,
        Buffer.from(await file.arrayBuffer()),
        file.type,
      );
    const result = await saveProduct(
      id,
      base,
      colors,
      !productId,
      revision,
      legacy,
    );
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/products/" + id);
    return NextResponse.json(result, { status: productId ? 200 : 201 });
  } catch (error) {
    return catalogError(error);
  }
}
