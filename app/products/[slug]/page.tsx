import { ProductDetail } from "../../components/store";
import { findStoreProduct } from "../../../server/repositories/product.repository";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params, searchParams }: { params: { slug: string }; searchParams: {color?: string; size?: string} }) {
  const product = await findStoreProduct(params.slug);
  return product ? <ProductDetail key={[product.id,searchParams.color,searchParams.size].join("/")} product={product} initialColor={searchParams.color} initialSize={searchParams.size} /> : <p className="empty-state">Product not found.</p>;
}
