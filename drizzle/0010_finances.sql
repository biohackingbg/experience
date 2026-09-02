CREATE TABLE "budgets" (
	"category" text PRIMARY KEY NOT NULL,
	"amount_cents" integer NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"category" text NOT NULL,
	"supplier" text NOT NULL,
	"description" text,
	"amount_cents" integer NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"invoice_no" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "deck_links" ADD COLUMN "tier" text;--> statement-breakpoint
ALTER TABLE "deck_links" ADD COLUMN "amount_cents" integer;--> statement-breakpoint
ALTER TABLE "deck_links" ADD COLUMN "money" text;--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category");