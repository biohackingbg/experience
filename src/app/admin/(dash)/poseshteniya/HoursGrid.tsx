import type { TrafficData } from "@/lib/site-views";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

/**
 * When people look, as a week of hours.
 *
 * A grid rather than a line: the question is not "how many" but "when" - and
 * two axes at once (day of the week against hour of the day) is what makes a
 * pattern visible. Sofia time, because that is the clock a post is scheduled
 * against. The number is in every cell's title, so the colour never has to be
 * read as a value on its own.
 */
export function HoursGrid({ hours, days }: { hours: TrafficData["hours"]; days: number }) {
  const grid = new Map<string, number>();
  let max = 0;
  for (const h of hours) {
    grid.set(`${h.weekday}:${h.hour}`, h.views);
    if (h.views > max) max = h.views;
  }

  if (max === 0) {
    return (
      <section className="mt-6 rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
        <h2 className="text-lg font-bold tracking-tight text-bh-ink">Кога гледат</h2>
        <p className="mt-4 text-sm text-bh-ink/55">Още няма достатъчно посещения за картина.</p>
      </section>
    );
  }

  // Totals down the side and along the bottom: the grid shows the shape, these
  // two say which day and which hour actually carry it.
  const perDay = DAYS.map((_, i) => hours.filter((h) => h.weekday === i + 1).reduce((n, h) => n + h.views, 0));
  const perHour = Array.from({ length: 24 }, (_, hour) => hours.filter((h) => h.hour === hour).reduce((n, h) => n + h.views, 0));
  const bestDay = perDay.indexOf(Math.max(...perDay));
  const bestHour = perHour.indexOf(Math.max(...perHour));

  return (
    <section className="mt-6 rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight text-bh-ink">Кога гледат</h2>
        <p className="text-xs text-bh-ink/55">
          последните {days} дни · българско време · най-силно в {DAYS[bestDay]} около {bestHour}:00
        </p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="min-w-[34rem]">
          <div className="flex items-center gap-1.5">
            <div className="w-8 shrink-0" />
            <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="text-center font-mono text-[0.55rem] text-bh-ink/40">
                  {hour % 3 === 0 ? hour : ""}
                </div>
              ))}
            </div>
            <div className="w-10 shrink-0" />
          </div>

          {DAYS.map((label, i) => {
            const weekday = i + 1;
            return (
              <div key={label} className="mt-1 flex items-center gap-1.5">
                <div className="w-8 shrink-0 font-mono text-[0.65rem] uppercase text-bh-ink/50">{label}</div>
                <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const n = grid.get(`${weekday}:${hour}`) ?? 0;
                    // Square root, so a single quiet hour is still visible
                    // next to a peak ten times its size.
                    const strength = n === 0 ? 0 : Math.sqrt(n / max);
                    return (
                      <div
                        key={hour}
                        title={`${label} ${String(hour).padStart(2, "0")}:00 · ${n} ${n === 1 ? "преглед" : "прегледа"}`}
                        className="aspect-square rounded-[3px]"
                        style={{
                          background: n === 0 ? "rgba(2,37,31,0.05)" : `rgba(20,100,85,${0.18 + strength * 0.82})`,
                        }}
                      />
                    );
                  })}
                </div>
                <div className="w-10 shrink-0 text-right font-mono text-[0.65rem] tabular-nums text-bh-ink/45">
                  {perDay[i] || ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-bh-ink/55">
        По-тъмното е повече прегледи. Мини с мишката върху квадратче за точния брой. Полезно е за две
        неща: кога да пускаш публикации и кога да включваш реклама.
      </p>
    </section>
  );
}
