/**
 * Shared between the form (client) and the write path (server), so the wording
 * a person sees is provably the wording we store. No server-only imports here —
 * this module is safe to pull into the browser bundle.
 */
export const CONSENT_VERSION = "v1";

export const CONSENT_TEXT =
  "Съгласявам се Biohacking.bg да съхранява имейла ми, за да ме уведоми за " +
  "старта на ранните билети за Biohacking Experience. Мога да оттегля " +
  "съгласието си по всяко време.";

export const TIERS = ["basic", "full", "protocol"] as const;

export const TIER_LABELS: Record<(typeof TIERS)[number], string> = {
  basic: "Основен — 50 €",
  full: "Пълен — 145 €",
  protocol: "Протокол — 390 €",
};
