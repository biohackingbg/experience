CREATE TABLE IF NOT EXISTS "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"starts_on" text NOT NULL,
	"days" integer DEFAULT 30 NOT NULL,
	"cohort_size" integer DEFAULT 20 NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"consent_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "challenges_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "challenge_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"email" text NOT NULL,
	"wake_target" text NOT NULL,
	"bed_target" text,
	"cohort" integer DEFAULT 1 NOT NULL,
	"consent_version" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "challenge_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"email" text NOT NULL,
	"day" integer NOT NULL,
	"wake" boolean DEFAULT false NOT NULL,
	"light" boolean DEFAULT false NOT NULL,
	"walk" boolean DEFAULT false NOT NULL,
	"bed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "challenge_participants" ADD CONSTRAINT "challenge_participants_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "challenge_checkins" ADD CONSTRAINT "challenge_checkins_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "challenge_participants_idx" ON "challenge_participants" USING btree ("challenge_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "challenge_checkins_idx" ON "challenge_checkins" USING btree ("challenge_id","email","day");--> statement-breakpoint
INSERT INTO "challenges" ("slug", "title", "starts_on", "days", "cohort_size", "active", "consent_version")
VALUES ('ritam-2026', '30 дни ритъм', '2026-11-10', 30, 20, true, 'ritam-v1-2026-10-05')
ON CONFLICT ("slug") DO NOTHING;
