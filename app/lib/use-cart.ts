"use client";
import { useState, useEffect } from "react";
import { CartItem, readCart } from "./cart";
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    const sync = () => setItems(readCart(window.localStorage));
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("pebbles-cart-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("pebbles-cart-updated", sync);
    };
  }, []);
  return items;
}
type Quote = CartItem & { available: number };
export function useQuotedCart() {
  const items = useCart();
  const [state, setState] = useState<{
    source: CartItem[];
    lines: Quote[];
    error: string;
  } | null>(null);
  useEffect(() => {
    if (!items.length) return;
    const abort = new AbortController();
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
      signal: abort.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const quotes: Quote[] = await r.json();
        if (!abort.signal.aborted)
          setState({
            source: items,
            error: "",
            lines: items.map((i) => ({
              ...i,
              ...quotes.find((q) => q.variantId === i.variantId),
              quantity: i.quantity,
              available:
                quotes.find((q) => q.variantId === i.variantId)?.available ?? 0,
            })),
          });
      })
      .catch(() => {
        if (!abort.signal.aborted)
          setState({
            source: items,
            lines: [],
            error:
              "Could not refresh prices and availability. Reload to try again.",
          });
      });
    return () => abort.abort();
  }, [items]);
  const fresh = state?.source === items && !state.error;
  const lines = fresh
    ? state.lines
    : items.map((i) => ({ ...i, available: 0 }));
  return {
    lines,
    ready:
      !!fresh &&
      lines.length > 0 &&
      lines.every((i) => i.available >= i.quantity),
    error: state?.source === items ? state.error : "",
    fresh,
  };
}
