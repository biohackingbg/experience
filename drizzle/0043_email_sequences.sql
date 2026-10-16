ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "upgrades_ticket_code" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"target" text NOT NULL,
	"email" text NOT NULL,
	"email_id" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"opened_at" timestamp with time zone,
	"clicked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_sends_kind_target_idx" ON "email_sends" ("kind","target");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_sends_email_id_idx" ON "email_sends" ("email_id");
--> statement-breakpoint
-- Loyalty code for Biohacking.bg course alumni: 15% off, one ticket each is
-- enforced by the letter (one code per address is not a thing the table knows).
INSERT INTO "promo_codes" ("code", "kind", "value", "max_uses", "note", "active")
VALUES ('ALUMNI', 'percent', 15, 150, 'Курсисти на Biohacking.bg - писмо от поредицата. Валиден и след 25.10.', true)
ON CONFLICT ("code") DO NOTHING;
