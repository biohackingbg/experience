CREATE TABLE "speaker_logistics" (
	"speaker_id" text PRIMARY KEY NOT NULL,
	"confirmed" boolean DEFAULT false NOT NULL,
	"email" text,
	"phone" text,
	"arrives" text,
	"departs" text,
	"hotel" text,
	"hotel_booked" boolean DEFAULT false NOT NULL,
	"tech" text,
	"presentation_at" timestamp with time zone,
	"dietary" text,
	"host" text,
	"notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "speaker_logistics" ADD CONSTRAINT "speaker_logistics_speaker_id_speakers_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."speakers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day" integer NOT NULL,
	"zone" text NOT NULL,
	"starts_at" text NOT NULL,
	"ends_at" text NOT NULL,
	"person" text NOT NULL,
	"phone" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "shifts_day_idx" ON "shifts" USING btree ("day","zone","starts_at");
