CREATE TABLE "speakers" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer NOT NULL,
	"announced" boolean DEFAULT false NOT NULL,
	"pending" boolean DEFAULT false NOT NULL,
	"title" text,
	"name" text NOT NULL,
	"specialty" text,
	"country" text,
	"affiliation" text,
	"role" text,
	"topic" text,
	"photo" bytea,
	"photo_mime" text,
	"photo_updated_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "speakers_sort_idx" ON "speakers" USING btree ("sort");
