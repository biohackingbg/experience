CREATE TABLE IF NOT EXISTS "booth_assignments" (
	"booth" text PRIMARY KEY NOT NULL,
	"deck_link_id" uuid,
	"hold_label" text,
	"note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "booth_assignments" ADD CONSTRAINT "booth_assignments_deck_link_id_deck_links_id_fk" FOREIGN KEY ("deck_link_id") REFERENCES "public"."deck_links"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
