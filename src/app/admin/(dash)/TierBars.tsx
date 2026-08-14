import type { TierSales } from "@/lib/admin-stats";
import { formatPrice } from "@/lib/tickets";

/**
 * Sold against capacity, one row per tier.
 *
 * A bar per tier rather than a pie: the job is magnitude against a known
 * ceiling, and the remaining track carries that ceiling for free. Each row is
 * named in text, so the hues label nothing on their own — they are validated
 * for colour-vision separation regardless (see the palette note below).
 */

/** Validated with the dataviz checker in both light and dark. */
const TIER_COLORS: Record<string, string> = {
  core: "#0E8C7D",
  plus: "#3F6FD8",
  peak: "#C4607F",
};

export function TierBars({ tiers }: { tiers: TierSales[] }) {
  const anySold = tiers.some((t) => t.sold > 0);

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold tracking-tight text-bh-ink">
        По нива
      </h2>
      <p className="mt-1 text-sm text-bh-ink/55">
        Продадени срещу капацитет.
      </p>

      <div className="mt-5 flex flex-col gap-5 rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
        {tiers.map((tier) => {
          const pct = tier.capacity
            ? Math.min(100, (tier.sold / tier.capacity) * 100)
            : 0;

          return (
            <div key={tier.id}>
              <div className="flex items-baseline justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: TIER_COLORS[tier.id] }}
                  />
                  <span className="text-sm font-semibold text-bh-ink">
                    {tier.name}
                  </span>
                </div>
                <div className="text-sm text-bh-ink/70">
                  <span className="font-semibold text-bh-ink">{tier.sold}</span>
                  <span className="text-bh-ink/45"> / {tier.capacity}</span>
                  {tier.grossCents > 0 && (
                    <span className="ml-3 text-bh-ink/55">
                      {formatPrice(tier.grossCents)} €
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-bh-ink/8">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: TIER_COLORS[tier.id],
                    // Keeps a sold-out bar from touching the track's end cap.
                    minWidth: tier.sold > 0 ? 6 : 0,
                  }}
                />
              </div>
            </div>
          );
        })}

        {!anySold && (
          <p className="pt-1 text-center text-sm text-bh-ink/50">
            Няма продадени билети още.
          </p>
        )}
      </div>
    </section>
  );
}
