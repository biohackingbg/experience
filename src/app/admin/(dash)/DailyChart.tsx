import type { DailySales } from "@/lib/admin-stats";
import { formatPrice } from "@/lib/tickets";

/**
 * Orders per day.
 *
 * One series, so no legend - the heading names it. Bars rather than a line:
 * each day is a discrete count, not a continuous reading. Only the tallest day
 * and the last are labelled directly; a number over every bar is noise.
 */
const SERIES = "#0E8C7D";

function formatDay(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(d)}.${Number(m)}`;
}

export function DailyChart({ data }: { data: DailySales[] }) {
  const max = data.reduce((m, d) => Math.max(m, d.orders), 0);
  const peakIndex = data.findIndex((d) => d.orders === max);

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold tracking-tight text-bh-ink">
        Поръчки по дни
      </h2>
      <p className="mt-1 text-sm text-bh-ink/55">
        Само платени поръчки, по деня на плащането.
      </p>

      <div className="mt-5 rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-bh-ink/50">
            Графиката ще се появи с първата платена поръчка.
          </p>
        ) : (
          <div className="flex h-52 items-end gap-[2px]">
            {data.map((day, i) => {
              const pct = max ? (day.orders / max) * 100 : 0;
              const labelled = i === peakIndex || i === data.length - 1;

              return (
                <div
                  key={day.day}
                  className="group relative flex flex-1 flex-col justify-end"
                  style={{ height: "100%" }}
                >
                  {labelled && (
                    <div className="mb-1 text-center text-[0.65rem] font-semibold text-bh-ink/70">
                      {day.orders}
                    </div>
                  )}

                  <div
                    className="rounded-t"
                    style={{
                      height: `${Math.max(pct, day.orders > 0 ? 3 : 0)}%`,
                      background: SERIES,
                    }}
                  />

                  {/* Hover detail - the bar alone cannot carry the money. */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-bh-ink px-3 py-2 text-xs text-bh-paper group-hover:block">
                    <div className="font-semibold">{formatDay(day.day)}</div>
                    <div className="opacity-80">
                      {day.orders} поръчки · {formatPrice(day.grossCents)} €
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {data.length > 0 && (
          <div className="mt-3 flex justify-between font-mono text-[0.65rem] text-bh-ink/45">
            <span>{formatDay(data[0].day)}</span>
            <span>{formatDay(data[data.length - 1].day)}</span>
          </div>
        )}
      </div>
    </section>
  );
}
