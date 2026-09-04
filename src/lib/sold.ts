import "server-only";

import { sql } from "drizzle-orm";

import { orders } from "@/lib/db/schema";

/**
 * What counts as a sale, in one place: paid, not the team's test, and not
 * refunded in full by amount. That last clause covers a refund that came
 * back from Stripe as a partial-refund event for the whole sum - the status
 * then stays "paid" and the order would otherwise keep counting as sold.
 */
export const SOLD = sql`${orders.status} = 'paid' and not ${orders.isTest} and coalesce(${orders.refundedCents}, 0) < ${orders.totalCents}`;

/** Money actually kept on a sold order, after any partial refund. */
export const KEPT_CENTS = sql<number>`(${orders.totalCents} - coalesce(${orders.refundedCents}, 0))`;
