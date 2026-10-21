import Link from "next/link";
import { AdminShell, ProductAdminTable } from "../../components/store";
export default function AdminProductsPage() { return <AdminShell><div className="admin-content"><div className="admin-title"><div><p className="eyebrow">Manage</p><h1>Products</h1></div><Link className="admin-button" href="/admin/products/new">+ Add product</Link></div><ProductAdminTable /></div></AdminShell>; }
