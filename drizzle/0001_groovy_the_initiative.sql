CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_id_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "product_images_product_id_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_stock_quantity_nonnegative" CHECK ("products"."stock_quantity" >= 0);