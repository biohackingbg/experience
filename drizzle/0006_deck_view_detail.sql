ALTER TABLE "deck_views" ADD COLUMN "view_id" text;--> statement-breakpoint
ALTER TABLE "deck_views" ADD COLUMN "visitor" text;--> statement-breakpoint
ALTER TABLE "deck_views" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "deck_views" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "deck_views" ADD COLUMN "browser" text;--> statement-breakpoint
ALTER TABLE "deck_views" ADD COLUMN "os" text;--> statement-breakpoint
ALTER TABLE "deck_views" ADD COLUMN "seconds" integer;--> statement-breakpoint
ALTER TABLE "deck_views" ADD COLUMN "scroll_pct" integer;--> statement-breakpoint
ALTER TABLE "deck_views" ADD COLUMN "section" text;--> statement-breakpoint
CREATE UNIQUE INDEX "deck_views_view_id_idx" ON "deck_views" USING btree ("view_id");