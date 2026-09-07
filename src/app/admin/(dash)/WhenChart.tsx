import type { DashboardData } from "@/lib/admin-stats";

/**
 * When people buy - twice over.
 *
 * The grid is three weeks of days by hour: read down a column for the pattern,
 * read across a row for what a single day did, which is what you want the
 * evening you post something. The bar under it is the same orders summed by
 * hour, so a habit shows even when no single day has many.
 *
 * The point is the sentence at the foot: the three hours that carry the most
 * sales are the hours a post or a letter should be aimed at.
 */
const SERIES = "#0E8C7D";
const DAY_NAMES = ["пн", "вт", "ср", "чт", "пт", "сб", "нд"];
const FULL_DAYS = ["понеделник", "вторник", "сряда", "четвъртък", "петък", "събота", "неделя"];

function bestWindow(byHour: number[]): { from: number; to: number; share: number } | null {
  const total = byHour.reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  let best = { from: 0, sum: -1 };
  for (let h = 0; h < 24; h++) {
    const sum = byHour[h] + byHour[(h + 1) % 24] + byHour[(h + 2) % 24];
    if (sum > best.sum) best = { from: h, sum };
  }
  return { from: best.from, to: (best.from + 3) % 24, share: Math.round((best.sum / total) * 100) };
}

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** "2026-09-06" -> { label: "06.09", dow: 6 } with the week starting Monday. */
function dayInfo(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
  return { label: `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}`, dow };
}

export function WhenChart({ byHour, punch }: Pick<DashboardData, "byHour" | "punch">) {
  const maxHour = Math.max(1, ...byHour);
  const maxCell = Math.max(1, ...punch.flatMap((p) => p.hours));
  const total = byHour.reduce((a, b) => a + b, 0);
  const window = bestWindow(byHour);
  const byWeekday = punch.reduce<number[]>((acc, p) => {
    const { dow } = dayInfo(p.day);
    acc[dow] += p.hours.reduce((a, b) => a + b, 0);
    return acc;
  }, Array(7).fill(0));
  const topDay = byWeekday.indexOf(Math.max(...byWeekday));
  const inWindow = (h: number) => (window ? (h - window.from + 24) % 24 < 3 : false);

  return (
    <section className="rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
      <h2 className="text-lg font-bold tracking-tight text-bh-ink">Кога купуват</h2>
      <p className="mt-1 text-sm text-bh-ink/55">
        Последните три седмици, ден по час, софийско време. По-тъмното е повече поръчки.
      </p>

      {total === 0 ? (
        <p className="py-10 text-center text-sm text-bh-ink/50">Ще се появи с първите платени поръчки.</p>
      ) : (
        <>
          <div className="mt-5 overflow-x-auto">
            <div className="min-w-[26rem]">
              <div className="flex flex-col gap-[3px]">
                {punch.map((row) => {
                  const { label, dow } = dayInfo(row.day);
                  const dayTotal = row.hours.reduce((a, b) => a + b, 0);
                  return (
                    <div key={row.day} className="flex items-center gap-2">
                      <span
                        className={`w-16 shrink-0 text-right font-mono text-[0.6rem] tabular-nums ${
                          dayTotal ? "text-bh-ink/70" : "text-bh-ink/30"
                        }`}
                      >
                        {DAY_NAMES[dow]} {label}
                      </span>
                      <div className="flex flex-1 gap-[2px]">
                        {row.hours.map((n, h) => (
                          <div
                            key={h}
                            title={`${label}, ${hh(h)} · ${n} ${n === 1 ? "поръчка" : "поръчки"}`}
                            className="h-3 flex-1 rounded-[2px]"
                            style={{
                              background: n
                                ? `color-mix(in oklab, ${SERIES} ${Math.round(35 + (n / maxCell) * 65)}%, #f2f4f1)`
                                : inWindow(h)
                                  ? "#0b2a220f"
                                  : "#0b2a2208",
                            }}
                          />
                        ))}
                      </div>
                      <span className={`w-5 shrink-0 text-right text-[0.6rem] tabular-nums ${dayTotal ? "text-bh-ink/60" : "text-bh-ink/25"}`}>
                        {dayTotal || ""}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* The same orders summed down the columns, so a habit shows even
                  when no single day has many. */}
              <div className="mt-3 flex items-center gap-2 border-t border-bh-ink/8 pt-3">
                <span className="w-16 shrink-0 text-right font-mono text-[0.6rem] uppercase tracking-wide text-bh-ink/40">общо</span>
                <div className="flex h-10 flex-1 items-end gap-[2px]">
                  {byHour.map((n, h) => (
                    <div
                      key={h}
                      title={`${hh(h)} · ${n}`}
                      className="flex-1 rounded-t-[2px]"
                      style={{
                        height: `${Math.max(n ? 10 : 3, (n / maxHour) * 100)}%`,
                        background: n === 0 ? "#0b2a2214" : inWindow(h) ? SERIES : "#0E8C7D66",
                      }}
                    />
                  ))}
                </div>
                <span className="w-5 shrink-0" />
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="w-16 shrink-0" />
                <div className="flex flex-1 gap-[2px]">
                  {byHour.map((_, h) => (
                    <span key={h} className="flex-1 text-center text-[0.55rem] tabular-nums text-bh-ink/35">
                      {h % 3 === 0 ? h : ""}
                    </span>
                  ))}
                </div>
                <span className="w-5 shrink-0" />
              </div>
            </div>
          </div>

          {window && (
            <p className="mt-5 border-t border-bh-ink/8 pt-4 text-sm leading-relaxed text-bh-ink/70">
              Най-много поръчки идват между <strong className="font-semibold text-bh-ink">{hh(window.from)} и {hh(window.to)}</strong>{" "}
              - {window.share}% от всички - и в{" "}
              <strong className="font-semibold text-bh-ink">{FULL_DAYS[topDay]}</strong>. Пускай постовете и писмата около час преди това.
            </p>
          )}
        </>
      )}
    </section>
  );
}
