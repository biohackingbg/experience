ALTER TABLE "deck_links" ADD COLUMN "contact_name" text;--> statement-breakpoint
ALTER TABLE "deck_links" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "deck_links" ADD COLUMN "contact_phone" text;--> statement-breakpoint
CREATE TABLE "deliverable_status" (
	"link_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"received_at" timestamp with time zone,
	"due_date" date,
	"note" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deliverable_status_link_id_kind_pk" PRIMARY KEY("link_id","kind")
);
--> statement-breakpoint
ALTER TABLE "deliverable_status" ADD CONSTRAINT "deliverable_status_link_id_deck_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."deck_links"("id") ON DELETE cascade ON UPDATE no action;
