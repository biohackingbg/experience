-- The holder's own address on a ticket given to someone else: the app signs
-- them in with it, and the team has every person's name and email.
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "attendee_email" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_attendee_email_idx" ON "tickets" USING btree (lower("attendee_email"));
