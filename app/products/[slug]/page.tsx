"use client";
import { products, ProductDetail } from "../../components/store";
export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = products.find((item) => item.id === params.slug);
  return product ? <ProductDetail product={product} /> : <p className="empty-state">Product not found.</p>;
}
