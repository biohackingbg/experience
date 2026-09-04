CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"posted_at" timestamp with time zone NOT NULL,
	"platform" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"utm_campaign" text,
	"spend_cents" integer DEFAULT 0 NOT NULL,
	"reach" integer,
	"likes" integer,
	"comments" integer,
	"saves" integer,
	"clicks" integer,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "campaigns_posted_at_idx" ON "campaigns" USING btree ("posted_at");--> statement-breakpoint
ALTER TABLE "site_views" ADD COLUMN "utm_source" text;--> statement-breakpoint
ALTER TABLE "site_views" ADD COLUMN "utm_campaign" text;--> statement-breakpoint
CREATE INDEX "site_views_utm_campaign_idx" ON "site_views" USING btree ("utm_campaign");--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "utm_source" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "utm_campaign" text;
