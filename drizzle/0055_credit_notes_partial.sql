-- Written by hand and applied to production by hand before the deploy ran,
-- so every step tolerates finding its work already done.
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "credited_quantity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credit_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"number" bigint NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"items" jsonb NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"vat_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"ticket_codes" text[]
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'credit_notes_order_id_orders_id_fk') THEN
		ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "credit_notes_number_idx" ON "credit_notes" USING btree ("number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_notes_order_id_idx" ON "credit_notes" USING btree ("order_id");
