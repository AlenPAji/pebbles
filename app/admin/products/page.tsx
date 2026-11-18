import Link from "next/link";
import { AdminShell, ProductAdminTable } from "../../components/store";

export const dynamic = "force-dynamic";

export default function AdminProductsPage({ searchParams }: { searchParams: { page?: string; q?: string; saved?: string } }) { return <AdminShell><div className="admin-content"><div className="admin-title"><div><p className="eyebrow">Manage</p><h1>Products</h1></div><Link className="admin-button" href="/admin/products/new">+ Add product</Link></div>{(searchParams.saved === "updated" || searchParams.saved === "created") && <p className="form-success" role="status">{searchParams.saved === "updated" ? "Product changes saved." : "Product created."}</p>}<ProductAdminTable page={Math.max(1, Number(searchParams.page) || 1)} initialQuery={searchParams.q ?? ""} /></div></AdminShell>; }
