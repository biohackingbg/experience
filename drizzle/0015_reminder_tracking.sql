ALTER TABLE "orders" ADD COLUMN "reminder_email_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reminder_opened_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reminder_clicked_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "orders_reminder_email_id_idx" ON "orders" USING btree ("reminder_email_id");
