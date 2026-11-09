import { NextResponse } from "next/server";

import { findProduct, markProductOutOfStock } from "../../../../../../server/repositories/product.repository";
import { requireVendor } from "../../../../../../server/services/vendor.service";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  await requireVendor();
  if (!await findProduct(params.id)) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json(await markProductOutOfStock(params.id));
}
