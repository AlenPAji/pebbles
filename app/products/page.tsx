import { ProductListing } from "../components/store";
import { listStoreProducts } from "../../server/repositories/product.repository";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: { category?: string; query?: string; page?: string } }) {
  const page = Number(searchParams.page) || 1;
  const result = await listStoreProducts({ category: searchParams.category, query: searchParams.query, page });
  return <ProductListing products={result.products} category={searchParams.category} query={searchParams.query} page={result.page} totalPages={result.totalPages} />;
}
