-- Apply in one transaction during a coordinated application cutover.
SET LOCAL lock_timeout = '10s';
--> statement-breakpoint
LOCK TABLE products, product_variants, product_images, orders, order_items, payments IN SHARE ROW EXCLUSIVE MODE;
--> statement-breakpoint
DO $audit$
BEGIN
  IF EXISTS (
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
WHERE status = 'succeeded' GROUP BY order_id HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'Variant migration blocked: review scripts/variant-audit.sql'; END IF;
END $audit$;
--> statement-breakpoint
CREATE TABLE "inventory_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"status" varchar(16) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "reservations_order_variant" UNIQUE("order_id","variant_id"),
	CONSTRAINT "reservations_valid" CHECK ("inventory_reservations"."quantity" > 0 and "inventory_reservations"."status" in ('reserved','released','consumed'))
);
--> statement-breakpoint
CREATE TABLE "payment_reviews" (
	"payment_id" varchar(255) PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"provider_order_id" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_colors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"code" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"hex" varchar(7),
	"sort_order" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "colors_product_id_id" UNIQUE("product_id","id"),
	CONSTRAINT "colors_valid" CHECK (btrim("product_colors"."code") <> '' and btrim("product_colors"."name") <> '' and ("product_colors"."hex" is null or "product_colors"."hex" ~ '^#[0-9A-Fa-f]{6}$'))
);
--> statement-breakpoint
ALTER TABLE "product_images" DROP CONSTRAINT "product_images_product_id_sort_order_unique";--> statement-breakpoint
ALTER TABLE "product_variants" DROP CONSTRAINT "product_variants_product_id_size_unique";--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "sku" SET DATA TYPE varchar(200);--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "sku" SET DATA TYPE varchar(200);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "color_name" varchar(100);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "color_hex" varchar(7);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "checkout_key" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "request_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "provider_order_id" varchar(255);--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "product_color_id" uuid;--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "product_color_id" uuid;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "price_override" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_reviews" ADD CONSTRAINT "payment_reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_colors" ADD CONSTRAINT "product_colors_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reservations_active" ON "inventory_reservations" USING btree ("variant_id","expires_at") WHERE "inventory_reservations"."status" = 'reserved';--> statement-breakpoint
CREATE INDEX "reviews_order" ON "payment_reviews" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "colors_code" ON "product_colors" USING btree ("product_id",lower(btrim("code")));--> statement-breakpoint
CREATE UNIQUE INDEX "colors_default" ON "product_colors" USING btree ("product_id") WHERE "product_colors"."is_default" and "product_colors"."deleted_at" is null;--> statement-breakpoint
-- Legacy IDs and object keys are retained. Old orders keep their original snapshots.
INSERT INTO product_colors (product_id, code, name, hex, sort_order, is_default)
SELECT id, 'default', coalesce(nullif(btrim(color_name), ''), 'Default'), nullif(btrim(color_hex), ''), 0, true FROM products;
--> statement-breakpoint
UPDATE product_variants v SET product_color_id=c.id FROM product_colors c WHERE c.product_id=v.product_id;
--> statement-breakpoint
UPDATE product_images i SET product_color_id=c.id FROM product_colors c WHERE c.product_id=i.product_id;
--> statement-breakpoint
ALTER TABLE product_variants ALTER COLUMN product_color_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE product_images ALTER COLUMN product_color_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "variants_product_id_id" UNIQUE("product_id","id");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "items_variant_owner" FOREIGN KEY ("product_id","variant_id") REFERENCES "public"."product_variants"("product_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "images_color_owner" FOREIGN KEY ("product_id","product_color_id") REFERENCES "public"."product_colors"("product_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "variants_color_owner" FOREIGN KEY ("product_id","product_color_id") REFERENCES "public"."product_colors"("product_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "items_variant_idx" ON "order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "images_color_order" ON "product_images" USING btree ("product_color_id","sort_order") WHERE "product_images"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "variants_sku" ON "product_variants" USING btree (lower(btrim("sku")));--> statement-breakpoint
CREATE UNIQUE INDEX "variants_color_size" ON "product_variants" USING btree ("product_color_id",lower(btrim("size"))) WHERE "product_variants"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_provider_order_id_unique" UNIQUE("provider_order_id");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_checkout_key" UNIQUE("user_id","checkout_key");--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "variants_valid" CHECK (btrim("product_variants"."size") <> '' and btrim("product_variants"."sku") <> '' and "product_variants"."price_override" >= 0);
