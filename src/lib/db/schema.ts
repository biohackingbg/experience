import {
  bigint,
  boolean,
  customType,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Early-access signups (waitlist for the September ticket release).
 *
 * Data is deliberately minimal - GDPR data minimisation. We do not store IP
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
    /** Verbatim consent copy shown at the time - versioned proof. */
    consentText: text("consent_text").notNull(),

    /** Where the signup came from (page section, campaign). Not a tracker. */
    source: text("source"),

    /** Set when the person asks to be removed; keeps the address on a
     *  suppression list so a later import cannot silently re-add them. */
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    /** Waiting list: when "a seat freed up" was sent, so it goes once. */
    notifiedAt: timestamp("notified_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("signups_created_at_idx").on(table.createdAt)],
);

export type Signup = typeof signups.$inferSelect;
export type NewSignup = typeof signups.$inferInsert;

/**
 * Ticket orders.
 *
 * Money and tier details are *snapshotted* onto the order and its items: an
 * order must always show what was actually charged, even after prices or tier
 * names change. The same goes for the VAT rate - rates change by law, and a
 * past invoice has to keep the rate that applied on the day.
 */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Short human-readable code used in emails and on the door. */
    reference: text("reference").notNull().unique(),

    /** pending | paid | cancelled | refunded */
    status: text("status").notNull().default("pending"),

    email: text("email").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),

    // Snapshot of the money, all in cents.
    subtotalCents: integer("subtotal_cents").notNull(),
    vatCents: integer("vat_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").notNull().default("EUR"),
    /** Stored in basis points (2000 = 20%) to avoid float drift. */
    vatRateBp: integer("vat_rate_bp").notNull(),

    /** Optional company details, when the buyer needs a company invoice. */
    invoiceCompany: text("invoice_company"),
    invoiceVatNumber: text("invoice_vat_number"),
    invoiceAddress: text("invoice_address"),

    /**
     * Invoice number from the site's own series, drawn from a Postgres
     * sequence the moment the order is paid - never on a pending one, so an
     * abandoned checkout cannot burn a number and leave a hole in the run.
     */
    invoiceNumber: bigint("invoice_number", { mode: "number" }),
    invoicedAt: timestamp("invoiced_at", { withTimezone: true }),

    stripePaymentIntentId: text("stripe_payment_intent_id"),

    /** Proof the buyer accepted the terms, same pattern as signups. */
    termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
    termsText: text("terms_text"),

    paidAt: timestamp("paid_at", { withTimezone: true }),

    /**
     * A real purchase made to test the flow, marked by the team afterwards.
     * Every statistic skips it; the invoice and any credit note stay, because
     * their numbers are in the sequence and the accountant must see them.
     */
    isTest: boolean("is_test").notNull().default(false),
    /** When the "see you next week" mail went to this buyer. Once per order. */
    infoSentAt: timestamp("info_sent_at", { withTimezone: true }),

    /**
     * Which campaign brought the buyer, from the utm_* tags on the link they
     * arrived through - carried from the landing page to the checkout in the
     * URL, never stored on their device. Null for everyone who came another
     * way, which is most people; the marketing page counts only what is here.
     */
    utmSource: text("utm_source"),
    utmCampaign: text("utm_campaign"),

    /**
     * The promo code used, and what it took off the gross. The order's
     * totals are already net of it; the invoice shows it as its own line so
     * the items and the total still add up in front of an accountant.
     */
    promoCode: text("promo_code"),
    discountCents: integer("discount_cents").notNull().default(0),

    /**
     * card - Stripe checkout (the default). bank - issued by the team,
     * paid by transfer against a proforma, marked paid by hand. admin - a
     * free order the team issued (partner or speaker tickets).
     */
    paymentMethod: text("payment_method").notNull().default("card"),
    /** For a bank order: until when the seats are held for the transfer. */
    bankDueAt: timestamp("bank_due_at", { withTimezone: true }),
    /** Team note on a manual order: "Партньор Dexcom, 10 билета по договор". */
    note: text("note"),
    /** bg | en - the language the buyer chose; the mails follow it. */
    lang: text("lang").notNull().default("bg"),

    /**
     * When the "you did not finish" email went out, for an abandoned checkout.
     * One reminder per order, ever - a buyer who walked away is not to be
     * chased, only told once that the door is still open.
     */
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    /** Resend's id for that email - the key its opened/clicked events carry. */
    reminderEmailId: text("reminder_email_id"),
    /** From Resend's webhook. An open is a hint (mail apps prefetch), a click is a person. */
    reminderOpenedAt: timestamp("reminder_opened_at", { withTimezone: true }),
    reminderClickedAt: timestamp("reminder_clicked_at", { withTimezone: true }),

    /**
     * Set from Stripe's charge.refunded event. A full refund flips `status`
     * to "refunded", which is what stops the tickets at the door; a partial
     * one only records the amount and leaves the order paid. The invoice
     * stays as issued - Bulgarian accounting answers a refund with a credit
     * note, which the accountant raises against this number.
     */
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    refundedCents: integer("refunded_cents"),

    /**
     * Credit note against the invoice, issued when a paid order is fully
     * refunded. Drawn from the SAME sequence as invoices - the VAT rules
     * put both document kinds in one ascending run.
     */
    creditNoteNumber: bigint("credit_note_number", { mode: "number" }),
    creditNotedAt: timestamp("credit_noted_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("orders_status_idx").on(table.status),
    index("orders_email_idx").on(table.email),
    index("orders_created_at_idx").on(table.createdAt),
    index("orders_reminder_email_id_idx").on(table.reminderEmailId),
    index("orders_promo_code_idx").on(table.promoCode),
    // Two invoices may never share a number; the database enforces it
    // rather than trusting the code that draws from the sequence.
    uniqueIndex("orders_invoice_number_idx").on(table.invoiceNumber),
    uniqueIndex("orders_credit_note_number_idx").on(table.creditNoteNumber),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    tierId: text("tier_id").notNull(),
    /** Snapshot - the tier may be renamed later. */
    tierName: text("tier_name").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (table) => [index("order_items_order_id_idx").on(table.orderId)],
);

/**
 * One row per admitted person - an order of three seats produces three, each
 * with its own code, so the door scans a person rather than a purchase.
 */
export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    /** Encoded into the QR. Unique across the event. */
    code: text("code").notNull().unique(),
    tierId: text("tier_id").notNull(),

    attendeeName: text("attendee_name"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("tickets_code_idx").on(table.code),
    index("tickets_order_id_idx").on(table.orderId),
    index("tickets_tier_id_idx").on(table.tierId),
  ],
);

/**
 * Share links for the partner deck. The deck is not reachable at a fixed URL:
 * every partner gets their own link (`/za-partniori/<token>`), created in the
 * admin, so an opening can be attributed to a company without asking anyone
 * for an email. Revoking a link closes it without touching the others.
 */
export const deckLinks = pgTable(
  "deck_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Who the link was made for: "Alma Lasers", "LinkedIn пост", "екип". */
    label: text("label").notNull(),
    /** URL-safe random token, the only thing the visitor sees. */
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),

    /**
     * Where the conversation with this partner stands - the link doubles as
     * the pipeline row, since there is exactly one per partner anyway.
     * new | contacted | waiting | confirmed | declined (see deck-links.ts).
     */
    stage: text("stage").notNull().default("new"),
    /** Free note: who we spoke to, what they said. */
    note: text("note"),
    /** What is expected from us next - the thing that must not be forgotten. */
    nextStep: text("next_step"),
    /** Who on the team leads this conversation (a first name is enough). */
    owner: text("owner"),
    updatedAt: timestamp("updated_at", { withTimezone: true }),

    /**
     * The money side of the same row. The pipeline row *is* the deal, so the
     * amount lives here rather than in a second list that would drift from
     * this one. Net of VAT, in cents; `money` is where the cash is:
     * agreed | invoiced | paid.
     */
    tier: text("tier"),
    amountCents: integer("amount_cents"),
    money: text("money"),

    /**
     * Barter, valued in cents. Kept apart from `amountCents` on purpose:
     * product never reaches the bank, so counting it as income would make
     * the result wrong. It is summed separately and shown beside the cash.
     */
    inKindCents: integer("in_kind_cents"),
    /**
     * What the partner actually delivers, as a comma-separated list of ids
     * from DELIVERABLES (finance-options.ts). A list rather than free text
     * because the question in October is countable: how many stands to
     * build, how many bag inserts to collect.
     */
    deliverables: text("deliverables"),
    /** Tickets included in the package - the one deliverable with a number. */
    ticketsCount: integer("tickets_count"),

    /** Who to call when a stand or a box of product is late. */
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
  },
  (table) => [uniqueIndex("deck_links_token_idx").on(table.token)],
);

/**
 * Whether each thing a partner promised has arrived. One row per
 * (partner, kind), created the first time someone ticks or dates it; a
 * promise with no row is simply "waiting, no date". The promise itself
 * stays on deck_links.deliverables - this table only records its fate.
 */
export const deliverableStatus = pgTable(
  "deliverable_status",
  {
    linkId: uuid("link_id")
      .notNull()
      .references(() => deckLinks.id, { onDelete: "cascade" }),
    /** A DELIVERABLES id, or "tickets" for the ticket allocation. */
    kind: text("kind").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }),
    dueDate: date("due_date"),
    note: text("note"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.linkId, table.kind] })],
);

/**
 * The expense ledger - one row per cost, net of VAT. Not accounting: the
 * accountant's books are the truth; this is the organisers' live view of
 * where the money goes. Nothing is deleted, a row is marked cancelled.
 */
export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** When the cost falls - invoice date, or the planned date. */
    date: timestamp("date", { withTimezone: true }).notNull(),
    /** One of a fixed list (finances.ts), so "Зала" and "зала" cannot split. */
    category: text("category").notNull(),
    supplier: text("supplier").notNull(),
    description: text("description"),
    amountCents: integer("amount_cents").notNull(),
    /** planned | invoiced | paid | cancelled */
    status: text("status").notNull().default("planned"),
    invoiceNo: text("invoice_no"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("expenses_category_idx").on(table.category)],
);

/** Budget per expense category, net of VAT - what "over budget" is measured against. */
export const budgets = pgTable("budgets", {
  category: text("category").primaryKey(),
  amountCents: integer("amount_cents").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

/**
 * One row per opening of a share link. Answers "how often, when, and roughly
 * from where" - nothing that identifies a person: no IP, no user agent, no
 * cookie. The referrer is kept as a bare hostname so a forwarded link ("came
 * from linkedin.com") can be told from a direct open, and no more.
 */
export const deckViews = pgTable(
  "deck_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    linkId: uuid("link_id")
      .notNull()
      .references(() => deckLinks.id, { onDelete: "cascade" }),
    referrerHost: text("referrer_host"),
    /** "mobile" | "desktop" - coarse, from the viewport, not the UA string. */
    device: text("device"),

    /**
     * Client-made id for this opening, so the progress beacon sent when the
     * tab is hidden or closed can find its own row. Random, per opening.
     */
    viewId: text("view_id"),
    /**
     * Random id kept in the visitor's localStorage *for this link only* - it
     * tells "3 openings by 2 people" from "3 people". Not shared across links
     * or with anything else, and it names nobody.
     */
    visitor: text("visitor"),

    /** Coarse location from the edge (Vercel geo headers); the IP is not kept. */
    country: text("country"),
    city: text("city"),
    /** Coarse client: "Safari" / "Chrome" …, "iOS" / "macOS" / "Windows" … */
    browser: text("browser"),
    os: text("os"),

    /** Engagement, filled in by the progress beacon; the max seen wins. */
    seconds: integer("seconds"),
    scrollPct: integer("scroll_pct"),
    /** Deepest deck section reached: cover … packages … next. */
    section: text("section"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("deck_views_link_created_idx").on(table.linkId, table.createdAt),
    uniqueIndex("deck_views_view_id_idx").on(table.viewId),
  ],
);

/**
 * Visits to the public site, kept ourselves rather than sent to an analytics
 * company - the numbers stay in our own database and no third party gets a
 * list of who reads about the event.
 *
 * There is no cookie and no identifier on the visitor's device, which is why
 * the site needs no consent banner for this. Repeat views are recognised by
 * `visitor`: a hash of address + browser + a secret that changes every day.
 * After midnight the same person hashes to something different, so the table
 * can count "how many people today" and can never be turned back into "who".
 */
export const siteViews = pgTable(
  "site_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Page path, query string stripped: "/", "/bilet", "/programa". */
    path: text("path").notNull(),
    /** Daily-rotating pseudonym, see above. Never an address. */
    visitor: text("visitor").notNull(),
    referrerHost: text("referrer_host"),
    /** "mobile" | "desktop", from the viewport rather than the UA string. */
    device: text("device"),
    country: text("country"),
    city: text("city"),
    /** Campaign tags from the URL (utm_source, utm_campaign) - the only query parameters kept. */
    utmSource: text("utm_source"),
    utmCampaign: text("utm_campaign"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("site_views_created_idx").on(table.createdAt),
    index("site_views_utm_campaign_idx").on(table.utmCampaign),
    index("site_views_path_created_idx").on(table.path, table.createdAt),
    index("site_views_visitor_idx").on(table.visitor, table.createdAt),
  ],
);

/**
 * The handful of switches the organisers flip themselves - today only whether
 * the launch prices are on. A key-value table rather than a column somewhere:
 * these are decisions, not data, and there will be two or three of them ever.
 * The code keeps a default for each key, so an empty table is a valid state.
 */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * The marketing log: one row per post, story, reel, ad or newsletter, with
 * what it cost and what the platform reported about it. Reach, likes and the
 * rest are typed in from the platform's insights; what the site saw - visits,
 * sales - is computed from site_views and orders and never stored here.
 */
export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull(),
    /** instagram | facebook | linkedin | tiktok | youtube | google | newsletter | other */
    platform: text("platform").notNull(),
    /** post | story | reel | ad | video | newsletter | other */
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    url: text("url"),
    /** The utm_campaign value on this campaign's links; what ties a sale to it. */
    utmCampaign: text("utm_campaign"),
    /** Paid media for this item, net, in cents. Zero for an organic post. */
    spendCents: integer("spend_cents").notNull().default(0),
    reach: integer("reach"),
    likes: integer("likes"),
    comments: integer("comments"),
    saves: integer("saves"),
    clicks: integer("clicks"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("campaigns_posted_at_idx").on(table.postedAt)],
);

/**
 * Discount codes: students, medical staff, partners' guests, a campaign.
 * `kind` percent takes `value` % off the gross; fixed takes `value` cents
 * off. A 100 % code makes a free order, which is paid without Stripe and
 * gets no invoice. Uses are counted from orders, never stored here.
 */
export const promoCodes = pgTable("promo_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Uppercase, letters and digits, unique. */
  code: text("code").notNull().unique(),
  /** percent | fixed */
  kind: text("kind").notNull(),
  value: integer("value").notNull(),
  maxUses: integer("max_uses"),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  note: text("note"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * The programme, one row per slot, editable from the admin. Empty until the
 * team imports the version in code (program.ts), which then stops being read.
 * Day headings (date, theme, intro) stay in code - they change once a year.
 */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** 1 = Saturday, 2 = Sunday. */
    day: integer("day").notNull(),
    sort: integer("sort").notNull(),
    /** As printed: "10:25-11:20". */
    time: text("time").notNull(),
    title: text("title").notNull(),
    note: text("note"),
    /** "Модератор: Диана Радева" - how the people below are billed. */
    role: text("role"),
    /** The English page falls back to the Bulgarian text where these are empty. */
    titleEn: text("title_en"),
    noteEn: text("note_en"),
    roleEn: text("role_en"),
    /** Names, one per line. */
    people: text("people"),
    /** Registration, coffee, lunch - rendered quietly. */
    pause: boolean("pause").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("sessions_day_sort_idx").on(table.day, table.sort)],
);

/** Raw bytes; the driver hands them over as a Buffer. */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/**
 * Speakers, editable from the admin, portrait included. Empty until the
 * team imports the list in code (speakers.ts) - after that the database is
 * what the site reads. The portrait lives here rather than in a bucket:
 * fifty people at a couple of hundred kilobytes is nothing to a database,
 * and one less service to configure and lose a key for.
 */
export const speakers = pgTable(
  "speakers",
  {
    /** The slug from the code list, or made from the name for new people. */
    id: text("id").primaryKey(),
    sort: integer("sort").notNull(),
    announced: boolean("announced").notNull().default(false),
    /** A slot still being confirmed: shown as a placeholder, never as a person. */
    pending: boolean("pending").notNull().default(false),
    title: text("title"),
    name: text("name").notNull(),
    specialty: text("specialty"),
    country: text("country"),
    affiliation: text("affiliation"),
    role: text("role"),
    topic: text("topic"),
    /** English versions; the English page falls back to the Bulgarian ones. */
    titleEn: text("title_en"),
    affiliationEn: text("affiliation_en"),
    specialtyEn: text("specialty_en"),
    roleEn: text("role_en"),
    topicEn: text("topic_en"),
    photo: bytea("photo"),
    photoMime: text("photo_mime"),
    /** Bumped on every upload; part of the image URL, so caches move on. */
    photoUpdatedAt: timestamp("photo_updated_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [index("speakers_sort_idx").on(table.sort)],
);

/**
 * Page-scoped access for people outside the team - an agency that logs
 * campaigns, a partner who checks the programme. Each grant is a link with
 * a long random token (only its hash is kept), a list of pages it opens,
 * and an expiry; revoking it closes the door at once. Never the password.
 */
export const accessGrants = pgTable("access_grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Who this is for: "Агенция X". */
  label: text("label").notNull(),
  /** Comma-separated page ids from access-options.ts. */
  scopes: text("scopes").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Workshops and special experiences - the parts of the programme with a
 * seat count. A ticket books a place here; what a ticket may book comes
 * from its tier (see workshops.ts), which is what the ticket page promises.
 */
export const workshops = pgTable("workshops", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** workshop | experience - the two things the tiers speak about separately. */
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  titleEn: text("title_en"),
  descriptionEn: text("description_en"),
  /** Who runs it, as it should read on the page. */
  host: text("host"),
  /** Room or zone, for the person looking for it on the day. */
  location: text("location"),
  /** 1 = Saturday, 2 = Sunday. */
  day: integer("day").notNull(),
  /** "11:00" - comparable as text, which is all the clash check needs. */
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at").notNull(),
  capacity: integer("capacity").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

/** One place, held by one ticket. The unique pair is what stops a double booking. */
export const workshopBookings = pgTable(
  "workshop_bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopId: uuid("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
    ticketId: uuid("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
    /** Scanned at the workshop's own door, if the team checks there too. */
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("workshop_bookings_pair_idx").on(table.workshopId, table.ticketId),
    index("workshop_bookings_ticket_idx").on(table.ticketId),
  ],
);

export type DeckLink = typeof deckLinks.$inferSelect;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;

/**
 * Where a speaker is on the two days and what they need: the sheet the
 * team works from in the last weeks. One row per speaker, created the first
 * time anyone types into it. Deleting the speaker deletes it.
 */
export const speakerLogistics = pgTable("speaker_logistics", {
  speakerId: text("speaker_id")
    .primaryKey()
    .references(() => speakers.id, { onDelete: "cascade" }),
  confirmed: boolean("confirmed").notNull().default(false),
  email: text("email"),
  phone: text("phone"),
  /** Free text: "06.11 14:30, полет W6 4321". */
  arrives: text("arrives"),
  departs: text("departs"),
  hotel: text("hotel"),
  hotelBooked: boolean("hotel_booked").notNull().default(false),
  /** "кликер, HDMI, звук за видео". */
  tech: text("tech"),
  /** When the slides came in; null while they are still owed. */
  presentationAt: timestamp("presentation_at", { withTimezone: true }),
  dietary: text("dietary"),
  /** Who meets them at the door. */
  host: text("host"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Who is on which zone at which hour on the two days: the team rota. */
export const shifts = pgTable(
  "shifts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    day: integer("day").notNull(),
    zone: text("zone").notNull(),
    startsAt: text("starts_at").notNull(),
    endsAt: text("ends_at").notNull(),
    person: text("person").notNull(),
    phone: text("phone"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("shifts_day_idx").on(table.day, table.zone, table.startsAt)],
);

/**
 * Every letter sent to a list, kept as written. Two reasons: the same news
 * should not go out twice by accident, and when someone asks "what did you
 * send me in September" the answer is here rather than in someone's memory.
 */
export const listMailings = pgTable("list_mailings", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Which list it went to: signups | buyers | waitlist. */
  audience: text("audience").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  ctaLabel: text("cta_label"),
  ctaUrl: text("cta_url"),
  recipients: integer("recipients").notNull().default(0),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  sentBy: text("sent_by"),
});
