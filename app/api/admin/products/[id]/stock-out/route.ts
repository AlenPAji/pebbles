import { NextResponse } from "next/server";

import { archiveOrStockOut } from "../../../../../../server/repositories/catalog-write";
import { catalogError } from "../../../../../../server/services/catalog-form";
import { requireVendor } from "../../../../../../server/services/vendor.service";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  await requireVendor();
  try { return NextResponse.json(await archiveOrStockOut(params.id,false)); }
  catch(error) { return catalogError(error); }
}
