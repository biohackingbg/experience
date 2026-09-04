/**
 * How long an unpaid order keeps holding a seat. Must stay LONGER than the
 * Checkout session's lifetime (30 min, Stripe's minimum) so a payment in the
 * session's final seconds still finds its seat held; short enough that
 * abandoned checkouts do not lock up the room.
 */
export const PENDING_HOLD_MINUTES = 35;
