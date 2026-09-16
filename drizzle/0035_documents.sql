CREATE TABLE IF NOT EXISTS "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"kind" text DEFAULT 'proforma' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"deck_link_id" uuid,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"company" text,
	"vat_number" text,
	"address" text,
	"subtotal_cents" integer NOT NULL,
	"vat_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"vat_rate_bp" integer NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"invoice_number" bigint,
	"invoiced_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"note" text,
	"lang" text DEFAULT 'bg' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "documents_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"description" text NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"quantity" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_deck_link_id_deck_links_id_fk" FOREIGN KEY ("deck_link_id") REFERENCES "public"."deck_links"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_lines" ADD CONSTRAINT "document_lines_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_lines_document_id_idx" ON "document_lines" USING btree ("document_id");
