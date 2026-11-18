import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { findProduct } from "../../../../../server/repositories/product.repository";
import { archiveOrStockOut } from "../../../../../server/repositories/catalog-write";
import { handleProductForm, catalogError } from "../../../../../server/services/catalog-form";
import { requireVendor } from "../../../../../server/services/vendor.service";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await requireVendor();
  const product = await findProduct(params.id);
  return product ? NextResponse.json(product) : NextResponse.json({ error: "Product not found" }, { status: 404 });
}

export async function PATCH(request: Request, {params}: {params:{id:string}}) {
  await requireVendor();
  return handleProductForm(request,params.id);
}

export async function DELETE(_: Request, {params}: {params:{id:string}}) {
  await requireVendor();
  try {
    const result = await archiveOrStockOut(params.id,true);
    revalidatePath("/"); revalidatePath("/products"); revalidatePath("/products/"+params.id);
    return NextResponse.json(result);
  } catch (error) { return catalogError(error); }
}
