import { NextResponse } from "next/server";
import { requireVendor } from "../../../../../../server/services/vendor.service";
import { setColorInventory } from "../../../../../../server/repositories/catalog-write";
import { parseVariants, optionalId, quantity } from "../../../../../../server/validators/catalog";
import { catalogError } from "../../../../../../server/services/catalog-form";

export async function PATCH(request: Request, {params}: {params:{id:string}}) {
  await requireVendor();
  try {
    const body = await request.json();
    const color = optionalId(body.colorId);
    const revision = color || body.revision !== undefined ? quantity(body.revision) : undefined;
    return NextResponse.json(await setColorInventory(params.id,color,parseVariants(body.variants),revision));
  } catch(error) { return catalogError(error); }
}
