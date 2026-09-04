CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" integer NOT NULL,
	"sort" integer NOT NULL,
	"time" text NOT NULL,
	"title" text NOT NULL,
	"note" text,
	"role" text,
	"people" text,
	"pause" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "sessions_day_sort_idx" ON "sessions" USING btree ("day","sort");
