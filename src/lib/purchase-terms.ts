/**
 * Wording the buyer accepts at checkout, stored verbatim on the order.
 *
 * Same reasoning as the signup consent: what a person saw is what we keep, so
 * a later change to the text cannot rewrite what past buyers agreed to. Safe
 * for the client bundle - no server-only imports.
 */
export const PURCHASE_TERMS_VERSION = "v1";

/** The same terms in English, stored verbatim when that is what the buyer saw. */
export const PURCHASE_TERMS_TEXT_EN =
  "I accept the ticket sales terms of Sofia Life Summit and confirm that I " +
  "understand the ticket is valid for a specific date and venue. I agree to " +
  "the service being provided on that date, whereby the right of withdrawal " +
  "under Art. 57 of the Bulgarian Consumer Protection Act does not apply.";

export const PURCHASE_TERMS_TEXT =
  "Приемам условията за продажба на билети за Sofia Life Summit и " +
  "потвърждавам, че съм запознат/а, че билетът важи за конкретна дата и " +
  "място. Съгласявам се услугата да бъде предоставена на посочената дата, " +
  "с което правото на отказ по чл. 57 от Закона за защита на потребителите " +
  "не се прилага.";
