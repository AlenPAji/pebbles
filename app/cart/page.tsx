"use client";
import Link from "next/link";
import { StoreShell } from "../components/store";
import { updateCart } from "../lib/cart";
import { useQuotedCart } from "../lib/use-cart";
import { money } from "../lib/format";

export default function CartPage() {
  const { lines, ready, fresh, error } = useQuotedCart();
  const total = lines.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const quantity = (id: string, count: number) =>
    updateCart((rows) =>
      rows.map((i) => (i.variantId === id ? { ...i, quantity: count } : i)),
    );
  return (
    <StoreShell>
      <main className="cart-page">
        <h1>Your cart</h1>
        {error && <p role="alert">{error}</p>}
        {lines.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty.</p>
            <Link href="/products">Continue shopping</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {lines.map((i) => (
                <article key={i.variantId} className="cart-item">
                  <div>
                    <h3>
                      <Link href={"/products/" + i.productId}>{i.name}</Link>
                    </h3>
                    <p>
                      {i.colorName} · {i.size} · {i.sku}
                    </p>
                    <p>{money(i.price)}</p>
                    {fresh && i.available < i.quantity && (
                      <p role="status">
                        Available now: {i.available}. Update or remove this
                        line.
                      </p>
                    )}
                    <div className="quantity">
                      <button
                        aria-label="Decrease quantity"
                        disabled={i.quantity <= 1}
                        onClick={() => quantity(i.variantId, i.quantity - 1)}
                      >
                        −
                      </button>
                      <span>{i.quantity}</span>
                      <button
                        aria-label="Increase quantity"
                        disabled={!fresh || i.quantity >= i.available}
                        onClick={() => quantity(i.variantId, i.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    className="remove"
                    onClick={() => quantity(i.variantId, 0)}
                  >
                    Remove
                  </button>
                </article>
              ))}
            </div>
            <aside className="order-summary">
              <p>Shipping · Free</p>
              <p>Total · {money(total)}</p>
              {ready && (
                <Link className="button dark-button" href="/checkout">
                  Checkout
                </Link>
              )}
            </aside>
          </div>
        )}
      </main>
    </StoreShell>
  );
}
