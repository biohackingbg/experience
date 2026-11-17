-- The post-event survey: one invitation per ticket (or partner), its own
-- link token, answered once; and the early-access list for 2027, where an
-- address added by someone else counts only once its owner confirms.
CREATE TABLE IF NOT EXISTS "survey_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"token" text NOT NULL,
	"ticket_id" uuid,
	"brand" text,
	"label" text,
	"sent_to" text,
	"holder_email" text,
	"sent_at" timestamp with time zone,
	"answers" jsonb,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "survey_invites_token_unique" UNIQUE("token"),
	CONSTRAINT "survey_invites_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE set null ON UPDATE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "survey_invites_kind_ticket_idx" ON "survey_invites" USING btree ("kind","ticket_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "survey_invites_sent_to_idx" ON "survey_invites" USING btree ("sent_to");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "early_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"invited_by" text,
	"source" text DEFAULT 'survey-2026' NOT NULL,
	"consent_text" text NOT NULL,
	"confirm_token" text,
	"confirmed_at" timestamp with time zone,
	"invite_sent_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "early_access_email_unique" UNIQUE("email"),
	CONSTRAINT "early_access_confirm_token_unique" UNIQUE("confirm_token")
);
