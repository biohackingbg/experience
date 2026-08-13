/**
 * Shared between the form (client) and the write path (server), so the wording
 * a person sees is provably the wording we store. No server-only imports here —
 * this module is safe to pull into the browser bundle.
 */
import {
  TIERS as TICKET_TIERS,
  formatPrice,
  priceCents,
} from "@/lib/tickets";

export const CONSENT_VERSION = "v2";

export const CONSENT_TEXT =
  "Съгласявам се Biohacking.bg да ми изпраща новини за Sofia Life Summit — " +
  "нови лектори, програма и цени на билетите. Мога да оттегля съгласието си " +
  "по всяко време.";

export const TIERS = ["basic", "full", "protocol"] as const;

/**
 * Derived rather than typed out, so the price offered on the signup form can
 * never fall behind the one the checkout charges. `early` comes from the
 * server for the same reason it does everywhere else.
 */
export function tierLabels(early: boolean): Record<(typeof TIERS)[number], string> {
  const label = (id: (typeof TIERS)[number]) => {
    const tier = TICKET_TIERS.find((t) => t.id === id)!;
    return `${tier.name} — ${formatPrice(priceCents(tier, early))} €`;
  };
  return { basic: label("basic"), full: label("full"), protocol: label("protocol") };
}
