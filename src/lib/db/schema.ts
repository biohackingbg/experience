import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Early-access signups (waitlist for the September ticket release).
 *
 * Data is deliberately minimal — GDPR data minimisation. We do not store IP
 * addresses or any tracking identifiers. What we do store is *proof of
 * consent*: the exact wording the person agreed to and when, which is what a
 * regulator asks for if the mailing list is ever challenged.
 */
export const signups = pgTable(
  "signups",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Stored lowercased and trimmed by the write path so the unique index
    // actually prevents duplicates.
    email: text("email").notNull().unique(),
    name: text("name"),

    /** Which ticket tier they were looking at: basic | full | protocol. Kept
     *  as text rather than an enum so adding a tier is a code change, not a
     *  migration on a live table. */
    interestedTier: text("interested_tier"),

    consented: boolean("consented").notNull(),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    /** Verbatim consent copy shown at the time — versioned proof. */
    consentText: text("consent_text").notNull(),

    /** Where the signup came from (page section, campaign). Not a tracker. */
    source: text("source"),

    /** Set when the person asks to be removed; keeps the address on a
     *  suppression list so a later import cannot silently re-add them. */
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("signups_created_at_idx").on(table.createdAt)],
);

export type Signup = typeof signups.$inferSelect;
export type NewSignup = typeof signups.$inferInsert;
