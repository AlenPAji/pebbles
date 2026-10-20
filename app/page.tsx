"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { addToCart, CartIcon, useCartCount } from "./components/store";

type Product = {
  name: string;
  category: string;
  price: string;
  image: string;
  tone: string;
  badge?: string;
};

const products: Product[] = [
  { name: "Indigo Cotton Kurta", category: "Kurtas", price: "₹2,490", image: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=900", tone: "sand", badge: "Bestseller" },
  { name: "Rose Handloom Saree", category: "Sarees", price: "₹4,890", image: "https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=900", tone: "blue" },
  { name: "Everyday Shell Top", category: "Tops", price: "₹1,890", image: "https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg?auto=compress&cs=tinysrgb&w=900", tone: "oat" },
  { name: "Marigold Anarkali Kurta", category: "Kurtas", price: "₹3,290", image: "https://images.pexels.com/photos/994523/pexels-photo-994523.jpeg?auto=compress&cs=tinysrgb&w=900", tone: "clay", badge: "New" }
];

const carouselSlides = [
  { src: "/images/carousel-image-0.png", alt: "The Chanderi Blue Collection" },
  { src: "/images/carousel-image-1.png", alt: "Pebbles clothing and accessories collection" },
  { src: "/images/carousel-image-2.png", alt: "Pebbles new collection" }
];

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

function Header({ count, onBag }: { count: number; onBag: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="announcement">Free shipping on orders over ₹1,999 <span>✦</span> Easy returns, always</div>
      <header className="site-header">
        <button className="mobile-menu" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}><Icon>{menuOpen ? "×" : "☰"}</Icon></button>
        <Link href="/" className="wordmark"><Image src="/images/pebbles-pebbles-wordmark-black-transparent.svg" alt="Pebbles" width={150} height={53} priority /></Link>
        <nav className={`nav-links ${menuOpen ? "nav-open" : ""}`} aria-label="Primary navigation">
          <Link href="/products">Shop</Link><Link href="/products?category=Sarees">Collections</Link><Link href="#story">Our story</Link><Link href="#journal">Journal</Link><Link className="mobile-nav-account" href="/login">Account</Link>
        </nav>
        <div className="header-actions">
          <Link className="search-link" href="/products" aria-label="Search"><Icon>⌕</Icon></Link><Link className="account-link" href="/login" aria-label="Account"><Icon>♙</Icon></Link>
          <Link className="bag-button" href="/cart" aria-label={`Open cart with ${count} items`}><CartIcon />{count > 0 && <span className="bag-count">{count}</span>}</Link>
        </div>
      </header>
    </>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <article className="product-card">
      <div className={`product-image ${product.tone}`}>
        {product.badge && <span className="badge">{product.badge}</span>}
        <Link href={`/products/${product.name.toLowerCase().replaceAll(" ", "-")}`} className="product-image-link" aria-label={`View ${product.name}`}><Image src={product.image} alt={product.name} fill sizes="(max-width: 700px) 50vw, 25vw" /></Link>
        <button className="heart" aria-label={`Save ${product.name}`}>♡</button>
        <button className="quick-add" onClick={onAdd}>Quick add <span>+</span></button>
      </div>
      <div className="product-info"><div><p className="eyebrow">{product.category}</p><Link href={`/products/${product.name.toLowerCase().replaceAll(" ", "-")}`}><h3>{product.name}</h3></Link></div><strong>{product.price}</strong></div>
    </article>
  );
}

export default function Home() {
  const [notice, setNotice] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const cartCount = useCartCount();
  const addToBag = (name = "Item") => { addToCart(); setNotice(`${name} added to your cart`); window.setTimeout(() => setNotice(""), 2600); };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((slide) => (slide + 1) % carouselSlides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main>
      <Header count={cartCount} onBag={() => setNotice(cartCount ? `${cartCount} item${cartCount > 1 ? "s" : ""} in your cart` : "Your cart is empty")} />
      {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
      <section className="hero-carousel" aria-label="Featured collection">
        {carouselSlides.map((slide, index) => <Image className={`hero-carousel-image ${index === activeSlide ? "active" : ""}`} key={slide.src} src={slide.src} alt={slide.alt} width={1744} height={608} priority={index === 0} />)}
      </section>
      <section className="collection section-pad" id="shop"><div className="section-heading"><div><p className="eyebrow">Shop the edit</p><h2>Made for <em>every day</em></h2></div><Link className="text-link" href="/products">View all products</Link></div><div className="product-grid">{products.map((product) => <ProductCard key={product.name} product={product} onAdd={() => addToBag(product.name)} />)}</div></section>
      <section className="categories section-pad" id="collections"><div className="section-heading"><div><p className="eyebrow">Find your kind</p><h2>Explore our <em>world</em></h2></div></div><div className="category-grid"><Link className="category category-large" href="/products?category=Kurtas"><Image src="https://images.unsplash.com/photo-1523381294911-8d3cead13475?auto=format&fit=crop&w=1100&q=85" alt="Kurtas collection" fill sizes="50vw" /><span>Kurtas</span></Link><Link className="category" href="/products?category=Sarees"><Image src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=85" alt="Sarees collection" fill sizes="25vw" /><span>Sarees</span></Link><Link className="category" href="/products?category=Tops"><Image src="https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=85" alt="Tops collection" fill sizes="25vw" /><span>Tops</span></Link></div></section>
      <section className="manifesto"><p className="eyebrow">The Pebbles promise</p><h2>Less, but <em>better.</em></h2><div className="promise-grid"><div><span>01</span><h3>Made to last</h3><p>Thoughtful materials and quiet details that get better with time.</p></div><div><span>02</span><h3>Mindful by default</h3><p>Small batches, responsible choices and no unnecessary extras.</p></div><div><span>03</span><h3>For real life</h3><p>Useful, tactile and made for the beautiful mess of everyday.</p></div></div></section>
      <section className="newsletter" id="journal"><div><p className="eyebrow">Stay in the loop</p><h2>Good things,<br /><em>occasionally.</em></h2></div><div><p>Notes on making, living and the things we love. No noise, just a little inspiration in your inbox.</p><form onSubmit={(event) => { event.preventDefault(); setNotice("Thanks for joining Pebbles"); }}><input type="email" placeholder="Your email address" aria-label="Your email address" required /><button type="submit">Subscribe <span>↗</span></button></form></div></section>
      <footer><div className="footer-top"><Link href="/"><Image src="/images/pebbles-pebbles-wordmark-black-transparent.svg" alt="Pebbles" width={130} height={46} /></Link><p>Small joys, thoughtfully made.</p><div className="socials"><a href="#instagram">Instagram</a><a href="#pinterest">Pinterest</a></div></div><div className="footer-bottom"><span>© 2025 Pebbles Studio</span><span>Made with intention in India</span><div><Link href="/contact">Contact</Link><Link href="/orders">Orders</Link><Link href="/profile">Account</Link><Link href="/cart">Cart</Link></div></div></footer>
    </main>
  );
}
