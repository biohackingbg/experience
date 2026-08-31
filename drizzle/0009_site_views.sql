CREATE TABLE "site_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"visitor" text NOT NULL,
	"referrer_host" text,
	"device" text,
	"country" text,
	"city" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "site_views_created_idx" ON "site_views" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "site_views_path_created_idx" ON "site_views" USING btree ("path","created_at");--> statement-breakpoint
CREATE INDEX "site_views_visitor_idx" ON "site_views" USING btree ("visitor","created_at");