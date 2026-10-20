import { AdminShell, AdminTable } from "../../components/store";
export default function CustomersPage() { return <AdminShell><div className="admin-content"><div className="admin-title"><div><p className="eyebrow">Manage</p><h1>Customers</h1></div></div><AdminTable type="customers" /></div></AdminShell>; }
