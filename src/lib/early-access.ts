import "server-only";

import { cache } from "react";
import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { PENDING_HOLD_MINUTES } from "@/lib/orders";
import { EARLY_ACCESS, isEarlyAccess } from "@/lib/tickets";

/**
 * How many of the launch-priced tickets are gone.
 *
 * Counted the same way seats are: paid orders, plus pending ones still inside
 * their hold. A checkout left open should not let somebody else take the last
 * launch price, and an abandoned one gives it back on its own.
 *
 * `cache` keeps it to one query per request no matter how many sections ask -
 * the nav, the ticket cards, the register block and the metadata all do.
 */
export const soldTowardsEarly = cache(async (): Promise<number> => {
  const [row] = await getDb()
    .select({ n: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
    .from(orderItems)
    .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
    .where(
      sql`${orders.status} = 'paid'
        or (${orders.status} = 'pending'
            and ${orders.createdAt} > now() - interval '${sql.raw(String(PENDING_HOLD_MINUTES))} minutes')`,
    );
  return row?.n ?? 0;
});

export type EarlyState = {
  early: boolean;
  sold: number;
  /** Never negative, and never larger than the limit. */
  left: number;
  limit: number;
  /**
   * True once it is worth saying the number out loud. Below this a countdown
   * is just noise; above it, "остават 12" is the most useful thing on the
   * page. It is also the honest direction: we start quiet and get louder as
   * the claim becomes more true.
   */
  urgent: boolean;
};

export const getEarlyState = cache(async (): Promise<EarlyState> => {
  const sold = await soldTowardsEarly();
  const left = Math.max(0, Math.min(EARLY_ACCESS.limit, EARLY_ACCESS.limit - sold));
  return {
    early: isEarlyAccess(sold),
    sold,
    left,
    limit: EARLY_ACCESS.limit,
    urgent: left > 0 && left <= 50,
  };
});
