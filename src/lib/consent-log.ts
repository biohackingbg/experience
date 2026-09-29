import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { consentLog } from "@/lib/db/schema";
import { MARKETING_CONSENT_VERSION } from "@/lib/marketing-consent";

/**
 * The consent log: writing one choice, and reading how the banner is doing.
 *
 * The numbers answer the organiser's question - how many say yes - and the
 * rows answer the regulator's: what did this person agree to, and when.
 */

export async function recordConsent(input: {
  consentId: string;
  version: string;
  analytics: boolean;
  marketing: boolean;
  visitor: string | null;
  path: string | null;
}): Promise<void> {
  await getDb().insert(consentLog).values(input);
}

export type ConsentStats = {
  /** Distinct people who answered under the current wording. */
  people: number;
  all: number;
  analyticsOnly: number;
  marketingOnly: number;
  none: number;
  /** The share of people whose latest answer allows marketing. */
  marketingRate: number;
  /** The share whose latest answer allows analytics. */
  analyticsRate: number;
  /** Rows, i.e. answers including changes of mind. */
  answers: number;
};

/**
 * Each person's *latest* answer, not every row: someone who accepted, then
 * withdrew, counts as a refusal - anything else would flatter the number.
 */
export async function getConsentStats(days: number): Promise<ConsentStats> {
  const rows = await getDb().execute<{ analytics: boolean; marketing: boolean; n: string }>(sql`
    with latest as (
      select distinct on (consent_id) consent_id, analytics, marketing
      from consent_log
      where version = ${MARKETING_CONSENT_VERSION}
        and created_at > now() - make_interval(days => ${days})
      order by consent_id, created_at desc
    )
    select analytics, marketing, count(*)::int as n from latest group by 1, 2
  `);
  const [{ answers }] = await getDb().execute<{ answers: string }>(sql`
    select count(*)::int as answers from consent_log
    where version = ${MARKETING_CONSENT_VERSION} and created_at > now() - make_interval(days => ${days})
  `);
  const count = (a: boolean, m: boolean) => Number(rows.find((r) => r.analytics === a && r.marketing === m)?.n ?? 0);
  const all = count(true, true);
  const analyticsOnly = count(true, false);
  const marketingOnly = count(false, true);
  const none = count(false, false);
  const people = all + analyticsOnly + marketingOnly + none;
  return {
    people,
    all,
    analyticsOnly,
    marketingOnly,
    none,
    marketingRate: people ? (all + marketingOnly) / people : 0,
    analyticsRate: people ? (all + analyticsOnly) / people : 0,
    answers: Number(answers ?? 0),
  };
}

/** Everything one consent id ever chose, newest first - what a visitor asking "what did I agree to" gets. */
export async function consentHistory(consentId: string) {
  return getDb()
    .select({
      version: consentLog.version,
      analytics: consentLog.analytics,
      marketing: consentLog.marketing,
      createdAt: consentLog.createdAt,
    })
    .from(consentLog)
    .where(eq(consentLog.consentId, consentId))
    .orderBy(desc(consentLog.createdAt))
    .limit(50);
}
