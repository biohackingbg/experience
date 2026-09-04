ALTER TABLE "orders" ADD COLUMN "payment_method" text DEFAULT 'card' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "bank_due_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "lang" text DEFAULT 'bg' NOT NULL;--> statement-breakpoint
ALTER TABLE "signups" ADD COLUMN "notified_at" timestamp with time zone;
