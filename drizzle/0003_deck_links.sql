CREATE TABLE "deck_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "deck_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "deck_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"referrer_host" text,
	"device" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deck_views" ADD CONSTRAINT "deck_views_link_id_deck_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."deck_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "deck_links_token_idx" ON "deck_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "deck_views_link_created_idx" ON "deck_views" USING btree ("link_id","created_at");