ALTER TABLE "orders" ADD COLUMN "invoice_number" bigint;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "invoiced_at" timestamp with time zone;--> statement-breakpoint
-- The site's own invoice series. A sequence rather than max()+1 so two
-- webhooks landing at the same instant cannot draw the same number.
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq AS bigint START WITH 2000000001 INCREMENT BY 1 NO CYCLE;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_invoice_number_idx" ON "orders" ("invoice_number");
