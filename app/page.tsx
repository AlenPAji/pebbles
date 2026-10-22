import { HomePage } from "./components/store";
import { listStoreProducts } from "../server/repositories/product.repository";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { products } = await listStoreProducts({ page: 1, pageSize: 4 });
  return <HomePage products={products} />;
}
