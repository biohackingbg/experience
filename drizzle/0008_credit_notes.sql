ALTER TABLE "orders" ADD COLUMN "credit_note_number" bigint;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "credit_noted_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_credit_note_number_idx" ON "orders" USING btree ("credit_note_number");