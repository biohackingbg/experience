/**
 * Calendar days in Sofia, counted as calendar days.
 *
 * Stepping back in 24-hour lumps is wrong twice a year: the clocks change, a
 * day is 23 or 25 hours long, and "now minus 24 hours" can land on the same
 * date again (on 25 October the dashboard showed 25 twice). Dates are
 * therefore taken as a Sofia date and moved by whole days on that date.
 */
const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" });

/** The last `n` Sofia dates as YYYY-MM-DD, oldest first, today last. */
export function sofiaDaysBack(n: number, now: Date = new Date()): string[] {
  const base = Date.parse(`${fmt.format(now)}T12:00:00Z`);
  return Array.from({ length: n }, (_, i) => new Date(base - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10));
}
