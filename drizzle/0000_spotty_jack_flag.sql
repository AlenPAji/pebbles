CREATE TYPE "public"."order_status" AS ENUM('confirmed', 'shipped', 'delivered', 'pending_payment', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('failed', 'succeeded');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('vendor', 'customer');--> statement-breakpoint
CREATE TABLE "order_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"recipient_name" varchar(255) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"city" varchar(150) NOT NULL,
	"pincode" varchar(20) NOT NULL,
	CONSTRAINT "order_addresses_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'pending_payment' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"shipping_amount" numeric(12, 2) NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" varchar(100) NOT NULL,
	"provider_payment_id" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" "payment_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_provider_provider_payment_id_unique" UNIQUE("provider","provider_payment_id")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"alt_text" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_images_product_id_sort_order_unique" UNIQUE("product_id","sort_order")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100),
	"price" numeric(12, 2) NOT NULL,
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"external_user_id" varchar(255) NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_external_user_id_unique" UNIQUE("external_user_id")
);
--> statement-breakpoint
ALTER TABLE "order_addresses" ADD CONSTRAINT "order_addresses_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;