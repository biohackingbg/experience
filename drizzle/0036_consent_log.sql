CREATE TABLE IF NOT EXISTS "consent_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consent_id" text NOT NULL,
	"version" text NOT NULL,
	"analytics" boolean NOT NULL,
	"marketing" boolean NOT NULL,
	"visitor" text,
	"path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consent_log_created_idx" ON "consent_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consent_log_consent_idx" ON "consent_log" USING btree ("consent_id");
