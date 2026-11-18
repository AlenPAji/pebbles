import { NextResponse } from "next/server";
import { listProducts } from "../../../../server/repositories/product.repository";
import { handleProductForm } from "../../../../server/services/catalog-form";
import { requireVendor } from "../../../../server/services/vendor.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireVendor();
    const searchParams = new URL(request.url).searchParams;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const query = searchParams.get("q") ?? undefined;
    return NextResponse.json(await listProducts({ page, query }), {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message === "Vendor access required") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw error;
  }
}

export async function POST(request: Request) {
  try { await requireVendor(); }
  catch (error) {
    if (error instanceof Error && error.message === "Authentication required") return NextResponse.json({error:"Unauthorized"},{status:401});
    if (error instanceof Error && error.message === "Vendor access required") return NextResponse.json({error:"Forbidden"},{status:403});
    throw error;
  }
  return handleProductForm(request);
}
