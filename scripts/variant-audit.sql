-- Blocking findings. Run on the branch before migration 0008.
SELECT 'duplicate_variant_sku' AS issue, lower(btrim(sku)) AS subject, count(*) AS occurrences
FROM product_variants GROUP BY lower(btrim(sku)) HAVING count(*) > 1
UNION ALL
SELECT 'duplicate_size', product_id::text || '/' || lower(btrim(size)), count(*)
FROM product_variants GROUP BY product_id, lower(btrim(size)) HAVING count(*) > 1
UNION ALL
SELECT 'invalid_variant', id::text, 1 FROM product_variants
WHERE btrim(size) = '' OR btrim(sku) = '' OR stock_quantity < 0
UNION ALL
SELECT 'invalid_product_price_or_hex', id::text, 1 FROM products
WHERE price < 0 OR (color_hex IS NOT NULL AND btrim(color_hex) <> '' AND color_hex !~ '^#[0-9A-Fa-f]{6}$')
UNION ALL
SELECT 'empty_image_key', id::text, 1 FROM product_images WHERE btrim(image_url) = ''
UNION ALL
SELECT 'multiple_successful_payments', order_id::text, count(*) FROM payments
WHERE status = 'succeeded' GROUP BY order_id HAVING count(*) > 1;

-- Historical discrepancies for review. Leave snapshots and references untouched.
SELECT 'item_without_exact_catalog_match' AS issue, count(*) FROM order_items i
WHERE NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.product_id=i.product_id AND v.sku=i.sku AND v.size=i.size)
UNION ALL
SELECT 'order_total_mismatch_or_missing_lines', count(*) FROM orders o
WHERE o.subtotal IS DISTINCT FROM (SELECT sum(quantity * unit_price) FROM order_items WHERE order_id=o.id)
OR o.total_amount <> o.subtotal + o.shipping_amount
UNION ALL
SELECT 'paid_order_without_successful_payment', count(*) FROM orders o WHERE status IN ('confirmed','shipped','delivered')
AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id=o.id AND p.status='succeeded')
UNION ALL
SELECT 'legacy_pending_order', count(*) FROM orders WHERE status='pending_payment';
