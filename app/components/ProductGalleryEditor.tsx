"use client";

import { useEffect, useRef, useState } from "react";
import type { GalleryItem } from "../lib/product-editor";

function Thumbnail({ item, position }: { item: GalleryItem; position: number }) {
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!item.file) return;
    const url = URL.createObjectURL(item.file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [item.file]);
  const src = item.saved?.imageUrl ?? preview;
  return <div className="ce-thumbnail">
    {src && <img src={src} alt={item.saved?.altText || item.file?.name || "Product image "+position} />}
    {position === 1 && <span className="ce-primary-tag">Primary</span>}
  </div>;
}

export function ProductGalleryEditor({ items, onChange, disabled }: {
  items: GalleryItem[]; onChange: (items: GalleryItem[]) => void; disabled: boolean;
}) {
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const replacement = useRef<string | null>(null);

  function receive(files: File[], replaceKey: string | null) {
    if (!files.length || disabled) return;
    const invalid = files.find(f => !f.type.startsWith("image/") || !f.size || f.size > 5 * 1024 * 1024);
    if (invalid) { setError(invalid.name+" must be a non-empty image of 5 MB or less."); return; }
    setError("");
    if (replaceKey) {
      onChange(items.map(item => item.key === replaceKey ? { key: item.key, file: files[0] } : item));
    } else {
      onChange([...items, ...files.map(file => ({ key: crypto.randomUUID(), file }))]);
    }
  }
  function browse(key: string | null) {
    if (!picker.current || disabled) return;
    replacement.current = key;
    picker.current.multiple = key === null;
    picker.current.click();
  }
  function move(index: number, delta: number) {
    const next = items.slice();
    [next[index], next[index+delta]] = [next[index+delta], next[index]];
    onChange(next);
  }
  return <section className="ce-gallery" aria-label="Image gallery">
    <div className="ce-subheading"><h3>Image gallery</h3>{items.length > 0 && <span>{items.length} {items.length === 1 ? "image" : "images"}</span>}</div>
    <input ref={picker} type="file" hidden aria-label="Gallery image files" accept="image/*" multiple onChange={e => {
      receive(Array.from(e.target.files ?? []), replacement.current);
      e.target.value = "";
    }} />
    <button type="button" className="ce-drop" data-dragging={dragging} onClick={() => browse(null)}
      onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); receive(Array.from(e.dataTransfer.files), null); }}>
      <span className="ce-upload-icon" aria-hidden="true">↑</span>
      <span><strong>Choose images <span>or drop them here</span></strong><small>Up to 5 MB per image</small></span>
    </button>
    {error && <p className="ce-error" role="alert">{error}</p>}
    {!!items.length && <ol className="ce-gallery-grid">{items.map((item, i) => (
      <li key={item.key}>
        <Thumbnail item={item} position={i+1} />
        <div className="ce-image-tools">
          <button type="button" aria-label={"Move image "+(i+1)+" earlier"} disabled={!i} onClick={() => move(i,-1)}>←</button>
          <button type="button" aria-label={"Move image "+(i+1)+" later"} disabled={i === items.length-1} onClick={() => move(i,1)}>→</button>
          <button type="button" aria-label={"Remove image "+(i+1)} onClick={() => onChange(items.filter(row => row.key !== item.key))}>×</button>
        </div>
        <button className="ce-replace" type="button" aria-label={"Replace image "+(i+1)} onClick={() => browse(item.key)}>Replace</button>
      </li>
    ))}</ol>}
  </section>;
}
