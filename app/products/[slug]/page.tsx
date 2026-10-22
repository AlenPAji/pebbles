import { ProductDetail } from "../../components/store";
import { findStoreProduct } from "../../../server/repositories/product.repository";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await findStoreProduct(params.slug);
  return product ? <ProductDetail product={product} /> : <p className="empty-state">Product not found.</p>;
}
