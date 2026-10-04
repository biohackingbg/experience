CREATE TABLE IF NOT EXISTS "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_link_id" uuid,
	"name" text NOT NULL,
	"category" text,
	"category_en" text,
	"tagline" text,
	"tagline_en" text,
	"description" text,
	"description_en" text,
	"website" text,
	"instagram" text,
	"logo" bytea,
	"logo_mime" text,
	"logo_updated_at" timestamp with time zone,
	"listed" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "partners" ADD CONSTRAINT "partners_deck_link_id_deck_links_id_fk" FOREIGN KEY ("deck_link_id") REFERENCES "public"."deck_links"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "partners_deck_link_idx" ON "partners" USING btree ("deck_link_id");--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "partner_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "offers" ADD CONSTRAINT "offers_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
