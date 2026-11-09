ALTER TABLE "orders"
  ADD COLUMN "shipping_carrier" varchar(100),
  ADD COLUMN "tracking_number" varchar(255),
  ADD COLUMN "tracking_url" text;