import "server-only";

import { createHash } from "node:crypto";

/**
 * Minimal in-memory throttle for public write endpoints.
 *
 * Deliberately ephemeral: keys are salted hashes of the caller's IP held only
 * in this instance's memory and dropped on restart. Nothing lands in the
 * database or in logs, so the abuse guard does not become a second, quieter
 * copy of people's personal data.
 *
 * It is per-instance, so it thins out floods rather than perfectly bounding
 * them. That is the right trade for a signup form; a distributed counter can
 * replace it if ticket sales need real quotas.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

type Bucket = { count: number; resetAt: number };

const globalForLimit = globalThis as unknown as {
  __bhBuckets?: Map<string, Bucket>;
};

const buckets = (globalForLimit.__bhBuckets ??= new Map<string, Bucket>());

function keyFor(identifier: string): string {
  // Salted so the stored key cannot be reversed back to an address.
  return createHash("sha256")
    .update(`bh-rate:${identifier}`)
    .digest("base64url")
    .slice(0, 22);
}

/**
 * `max` is per caller per minute. It defaults to the strict form-submission
 * budget; a page-view beacon passes a bigger one, since somebody reading
 * quickly through the programme is not abuse.
 */
export function checkRateLimit(
  identifier: string,
  max: number = MAX_PER_WINDOW,
): { allowed: boolean } {
  const now = Date.now();
  const key = keyFor(identifier);
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });

    // Opportunistic cleanup so the map cannot grow without bound.
    if (buckets.size > 5_000) {
      for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
    }

    return { allowed: true };
  }

  bucket.count += 1;
  return { allowed: bucket.count <= max };
}
