import "server-only";

import Stripe from "stripe";

/**
 * Stripe client. `server-only` keeps the secret key from ever reaching a
 * client bundle - the same guard the database module uses.
 *
 * Lazy, so importing this file never fails at build time; only an actual call
 * requires the key to be configured.
 */

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add the test key locally and in Vercel.",
    );
  }

  client = new Stripe(key);
  return client;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** True while the test keys are in use - drives the "test mode" banner. */
export function isTestMode(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");
}
