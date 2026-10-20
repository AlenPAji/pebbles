"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, ReactNode, useState } from "react";

export type Product = {
  id: string;
  name: string;
  category: "Kurtas" | "Sarees" | "Tops";
  price: number;
  image: string;
  description: string;
  badge?: string;
};

export const products: Product[] = [
  { id: "indigo-cotton-kurta", name: "Indigo Cotton Kurta", category: "Kurtas", price: 2490, image: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=900", description: "A relaxed, everyday kurta in breathable cotton with a hand-finished neckline." },
  { id: "marigold-anarkali-kurta", name: "Marigold Anarkali Kurta", category: "Kurtas", price: 3290, image: "https://images.pexels.com/photos/994523/pexels-photo-994523.jpeg?auto=compress&cs=tinysrgb&w=900", description: "A softly flared silhouette in a warm marigold weave, made for slow celebrations.", badge: "Bestseller" },
  { id: "rose-handloom-saree", name: "Rose Handloom Saree", category: "Sarees", price: 4890, image: "https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=900", description: "A lightweight handloom saree with a quiet border and an easy, elegant drape." },
  { id: "indigo-ikat-saree", name: "Indigo Ikat Saree", category: "Sarees", price: 5690, image: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=900", description: "Traditional ikat texture reimagined in deep indigo for everyday dressing.", badge: "New" },
  { id: "everyday-shell-top", name: "Everyday Shell Top", category: "Tops", price: 1890, image: "https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg?auto=compress&cs=tinysrgb&w=900", description: "A versatile shell top cut from soft cotton with a clean, easy neckline." },
  { id: "clay-wrap-top", name: "Clay Wrap Top", category: "Tops", price: 2190, image: "https://images.pexels.com/photos/1755428/pexels-photo-1755428.jpeg?auto=compress&cs=tinysrgb&w=900", description: "A softly structured wrap top in a warm clay tone, finished with fabric ties." }
];

export const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <div className="announcement">Free shipping on orders over ₹1,999 <span>✦</span> Easy returns, always</div>
      <header className="site-header">
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu">☰</button>
        <Link href="/" className="wordmark"><Image src="/images/pebbles-classic-black.svg" alt="Pebbles" width={150} height={53} priority /></Link>
        <nav className={`nav-links ${menuOpen ? "nav-open" : ""}`}>
          <Link href="/products">Shop</Link><Link href="/products?category=Sarees">Collections</Link><Link href="/#story">Our story</Link><Link href="/contact">Contact</Link>
        </nav>
        <div className="header-actions"><Link href="/products" aria-label="Search">⌕</Link><Link href="/login" aria-label="Account">♙</Link><Link className="bag-button" href="/cart">♧ <span>Bag (0)</span></Link></div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return <footer><div className="footer-top"><Image src="/images/pebbles-classic-black.svg" alt="Pebbles" width={130} height={46} /><p>Small joys, thoughtfully made.</p><div className="socials"><a href="#instagram">Instagram</a><a href="#pinterest">Pinterest</a></div></div><div className="footer-bottom"><span>© 2025 Pebbles Studio</span><span>Made with intention in India</span><div><Link href="/contact">Contact</Link><Link href="/orders">Orders</Link><Link href="/profile">Account</Link></div></div></footer>;
}

export function StoreShell({ children }: { children: ReactNode }) {
  return <><SiteHeader />{children}<SiteFooter /></>;
}

export function ProductCard({ product }: { product: Product }) {
  return <article className="product-card"><Link href={`/products/${product.id}`} className="product-image product-image-large">{product.badge && <span className="badge">{product.badge}</span>}<button className="heart" aria-label={`Save ${product.name}`} onClick={(event) => event.preventDefault()}>♡</button><Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 50vw, 25vw" /></Link><div className="product-info"><div><p className="eyebrow">{product.category}</p><Link href={`/products/${product.id}`}><h3>{product.name}</h3></Link></div><strong>{money(product.price)}</strong></div></article>;
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: ReactNode; description?: string }) {
  return <section className="page-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p>{description}</p>}</section>;
}

export function ProductListing() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(() => {
    if (typeof window === "undefined") return "All";
    const requestedCategory = new URLSearchParams(window.location.search).get("category");
    return requestedCategory && ["Kurtas", "Sarees", "Tops"].includes(requestedCategory) ? requestedCategory : "All";
  });
  const visible = products.filter((product) => (category === "All" || product.category === category) && product.name.toLowerCase().includes(query.toLowerCase()));
  return <StoreShell><PageIntro eyebrow="The collection" title={<>Dressed for <em>every day.</em></>} description="Kurtas, sarees and tops made with beautiful textiles and an easy point of view." /><section className="listing-section"><div className="listing-toolbar"><div className="filter-buttons">{["All", "Kurtas", "Sarees", "Tops"].map((item) => <button className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products..." aria-label="Search products" /></div><div className="product-grid product-grid-list">{visible.map((product) => <ProductCard key={product.id} product={product} />)}</div>{visible.length === 0 && <p className="empty-state">No pieces found. Try another search.</p>}</section></StoreShell>;
}

export function ProductDetail({ product }: { product: Product }) {
  const [added, setAdded] = useState(false);
  return <StoreShell><div className="detail-page"><div className="detail-image"><Image src={product.image} alt={product.name} fill sizes="(max-width: 800px) 100vw, 52vw" priority /></div><div className="detail-copy"><p className="eyebrow">{product.category}</p><h1>{product.name}</h1><p className="detail-price">{money(product.price)}</p><p className="detail-description">{product.description}</p><div className="size-label">Select size <span>Size guide</span></div><div className="size-options"><button>S</button><button>M</button><button>L</button><button>XL</button></div><button className="button dark-button add-button" onClick={() => setAdded(true)}>{added ? "Added to bag ✓" : "Add to bag"} <span>↗</span></button><div className="detail-notes"><p><b>Material</b> 100% cotton, naturally dyed</p><p><b>Care</b> Gentle machine wash, dry in shade</p><p><b>Delivery</b> Ships within 2–4 business days</p></div></div></div></StoreShell>;
}

export function SimpleForm({ title, button, children, note }: { title: ReactNode; button: string; children: ReactNode; note?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSubmitted(true); };
  return <StoreShell><div className="form-page"><p className="eyebrow">Pebbles account</p><h1>{submitted ? "You're all set." : title}</h1>{submitted ? <p className="form-success">Thanks. We&apos;ve received your details.</p> : <form onSubmit={submit}>{children}<button className="button dark-button" type="submit">{button} <span>↗</span></button></form>}{note && <p className="form-note">{note}</p>}</div></StoreShell>;
}

export function Field({ label, type = "text", placeholder }: { label: string; type?: string; placeholder?: string }) {
  return <label className="field"><span>{label}</span><input type={type} placeholder={placeholder} required /></label>;
}

export function AdminShell({ children }: { children: ReactNode }) {
  return <div className="admin-layout"><aside className="admin-sidebar"><Link href="/admin" className="admin-brand">PEBBLES<span>STUDIO</span></Link><nav><p>Overview</p><Link href="/admin">Dashboard</Link><p>Manage</p><Link href="/admin/products">Products</Link><Link href="/admin/categories">Categories</Link><Link href="/admin/orders">Orders</Link><Link href="/admin/customers">Customers</Link></nav><Link href="/" className="back-store">← View storefront</Link></aside><section className="admin-main"><header className="admin-header"><span>Tuesday, 20 October 2026</span><Link href="/admin/login">Admin account ↗</Link></header>{children}</section></div>;
}

export function AdminTable({ type }: { type: "products" | "orders" | "customers" }) {
  const rows = type === "products" ? products.map((product) => [product.name, product.category, money(product.price), "In stock"]) : type === "orders" ? [["#PB-1048", "Ananya Mehta", money(5780), "Processing"], ["#PB-1047", "Riya Shah", money(2490), "Shipped"], ["#PB-1046", "Maya Iyer", money(4890), "Delivered"]] : [["Ananya Mehta", "ananya@example.com", "4 orders", money(12400)], ["Riya Shah", "riya@example.com", "2 orders", money(5780)], ["Maya Iyer", "maya@example.com", "1 order", money(4890)]];
  return <div className="admin-table-wrap"><table><thead><tr>{(type === "products" ? ["Product", "Category", "Price", "Status"] : type === "orders" ? ["Order", "Customer", "Total", "Status"] : ["Customer", "Email", "Orders", "Spent"]).map((heading) => <th key={heading}>{heading}</th>)}<th>Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}<td><button className="table-action">View →</button></td></tr>)}</tbody></table></div>;
}

export function ProductForm({ title, button }: { title: string; button: string }) {
  return <div className="admin-content narrow-admin"><p className="eyebrow">Products</p><h1>{title}</h1><form className="admin-form"><Field label="Product name" /><div className="field-row"><Field label="Category" /><Field label="Price (₹)" /></div><label className="field"><span>Description</span><textarea rows={5} /></label><label className="upload-box">＋<span>Upload product images</span><small>PNG, JPG up to 5MB</small><input type="file" /></label><button className="admin-button" type="submit">{button} →</button></form></div>;
}
