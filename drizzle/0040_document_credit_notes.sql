ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "credit_note_number" bigint;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "credit_noted_at" timestamp with time zone;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_credit_note_number_unique" UNIQUE("credit_note_number");
EXCEPTION
 WHEN duplicate_object THEN null;
 WHEN duplicate_table THEN null;
END $$;
