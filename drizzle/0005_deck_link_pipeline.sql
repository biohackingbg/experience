ALTER TABLE "deck_links" ADD COLUMN "stage" text DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "deck_links" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "deck_links" ADD COLUMN "next_step" text;--> statement-breakpoint
ALTER TABLE "deck_links" ADD COLUMN "updated_at" timestamp with time zone;