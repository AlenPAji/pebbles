import { AdminShell } from "../../../../components/store";
import { ProductForm } from "../../../../components/store";
import { findProduct } from "../../../../../server/repositories/product.repository";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await findProduct(params.id);
  if (!product) return <AdminShell><div className="admin-content"><h1>Product not found</h1></div></AdminShell>;
  return <AdminShell><ProductForm title="Edit product" button="Save changes" product={product} /></AdminShell>;
}
