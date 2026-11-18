"use client";

import { useState } from "react";
import { sizeFieldId, sizeRows, type EditorColor, type VariantDraft } from "../lib/product-editor";

export function ProductInventoryEditor({ color, saree, change, errors }: {
  color: EditorColor; saree: boolean; change: (variants: VariantDraft[]) => void; errors: Record<string,string>;
}) {
  const [adding, setAdding] = useState(false);
  const [newSize, setNewSize] = useState("");
  const [sizeError, setSizeError] = useState("");
  const rows = sizeRows(color, saree);

  function addSize() {
    const size = newSize.trim();
    if (!size || size.length > 10) { setSizeError("Enter a size of 1 to 10 characters."); return; }
    if (rows.some(v => v.size.toLowerCase() === size.toLowerCase())) { setSizeError("This size is already listed."); return; }
    change([...color.variants, { size, sku: "", stockQuantity: 0 }]);
    setNewSize(""); setSizeError(""); setAdding(false);
    requestAnimationFrame(() => document.getElementById(sizeFieldId(color.key, size)+"-stock")?.focus());
  }
  function remaining(row: VariantDraft) {
    if (saree && color.variants.length === 1) return [];
    return color.variants.filter(v => row.id ? v.id !== row.id : v.size !== row.size);
  }
  const sizesId = color.key+"-sizes";
  return <section className="ce-inventory" aria-label="Size and inventory">
    <div className="ce-subheading"><h3 id={sizesId} tabIndex={-1}>Size &amp; inventory</h3>
      {!saree && <button className="ce-secondary ce-small" type="button" aria-expanded={adding} onClick={() => {setAdding(!adding); setSizeError("");}}>＋ Add size</button>}
    </div>
    {!saree && adding && <div className="ce-add-size">
      <label>New size<input autoFocus value={newSize} maxLength={10} placeholder="e.g. XS or 4XL" onChange={e => setNewSize(e.target.value)}
        onKeyDown={e => {if (e.key === "Enter") {e.preventDefault(); addSize();}}}/></label>
      <button type="button" className="ce-secondary" onClick={addSize}>Add</button>
      {sizeError && <span className="ce-error" role="alert">{sizeError}</span>}
    </div>}
    {errors[sizesId] && <p className="ce-error">{errors[sizesId]}</p>}
    <table className="ce-stock-table"><thead><tr><th scope="col">Size</th><th scope="col">SKU</th><th scope="col">Stock quantity</th><th scope="col">Price override (₹)</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
      <tbody>{rows.map(row => {
        const id = sizeFieldId(color.key, row.size);
        const edit = (patch: Partial<VariantDraft>) => change([...remaining(row), {...row, ...patch}]);
        const inputAttrs = (suffix: string) => ({
          id: id+suffix, "aria-invalid": !!errors[id+suffix], "aria-describedby": errors[id+suffix] ? id+suffix+"-error" : undefined
        });
        const message = (suffix: string) => errors[id+suffix] && <small className="ce-error" id={id+suffix+"-error"}>{errors[id+suffix]}</small>;
        return <tr key={row.size}>
          <th scope="row"><span className="ce-size-token">{row.size}</span>
            {row.stockQuantity === 0 && <small className="ce-out">Out of stock</small>}</th>
          <td><label htmlFor={id+"-sku"}>SKU</label><input {...inputAttrs("-sku")} aria-label={row.size+" SKU"} value={row.sku} maxLength={200} placeholder="Automatic" onChange={e => edit({sku:e.target.value})}/>{message("-sku")}</td>
          <td><label htmlFor={id+"-stock"}>Stock quantity</label><input {...inputAttrs("-stock")} aria-label={row.size+" stock"} type="number" min="0" step="1" value={row.stockQuantity} onChange={e => edit({stockQuantity:Number(e.target.value)})}/>{message("-stock")}</td>
          <td><label htmlFor={id+"-price"}>Price override (₹)</label><input {...inputAttrs("-price")} aria-label={row.size+" price override"} inputMode="decimal" placeholder="Base price" value={row.priceOverride ?? ""} onChange={e => edit({priceOverride:e.target.value})}/>{message("-price")}</td>
          <td>{(row.id || color.variants.some(v => v.size === row.size)) && <button className="ce-remove-size" type="button" title={"Remove size "+row.size} aria-label={"Remove size "+row.size} onClick={() => change(remaining(row))}>×</button>}</td>
        </tr>;
      })}</tbody>
    </table>
  </section>;
}
