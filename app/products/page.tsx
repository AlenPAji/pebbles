import { ProductListing } from "../components/store";
import { listProductColors, listStoreProducts } from "../../server/repositories/product.repository";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: { category?: string; color?: string; size?: string; query?: string; page?: string } }) {
  const page = Number(searchParams.page) || 1;
  const [result, colors] = await Promise.all([
    listStoreProducts({ category: searchParams.category, color: searchParams.color, size: searchParams.size, query: searchParams.query, page }),
    listProductColors()
  ]);
  return <ProductListing products={result.products} category={searchParams.category} color={searchParams.color} size={searchParams.size} colors={colors} query={searchParams.query} page={result.page} totalPages={result.totalPages} />;
}
