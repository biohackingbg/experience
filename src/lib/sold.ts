import "server-only";

import { sql } from "drizzle-orm";

import { orders } from "@/lib/db/schema";

/**
 * What counts as a sale, in one place: paid, not the team's test, and not
 * refunded in full by amount. That last clause covers a refund that came
 * back from Stripe as a partial-refund event for the whole sum - the status
 * then stays "paid" and the order would otherwise keep counting as sold.
 */
// A free order (partner, speaker) has nothing to refund and must still count.
export const SOLD = sql`${orders.status} = 'paid' and not ${orders.isTest} and (${orders.totalCents} = 0 or coalesce(${orders.refundedCents}, 0) < ${orders.totalCents})`;

/** Money actually kept on a sold order, after any partial refund. */
export const KEPT_CENTS = sql<number>`(${orders.totalCents} - coalesce(${orders.refundedCents}, 0))`;

/**
 * A sale, as opposed to a seat: a sold order that money changed hands for.
 * A ticket issued at no charge - a speaker's, a partner's, the team's own -
 * admits a person and takes a seat, but it is not a sale, and counting it as
 * one would flatter every number the team steers by.
 */
export const SALE = sql`${SOLD} and ${orders.totalCents} > 0`;

/** The other half: sold, seated, and free. */
export const COMPED = sql`${SOLD} and ${orders.totalCents} = 0`;
