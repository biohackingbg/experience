import type { DashboardData } from "@/lib/admin-stats";

/**
 * When people buy.
 *
 * Two readings of the same orders: the hour of the Sofia day and the day of
 * the week. The point is not the picture but the sentence under it - the
 * three-hour window that carries the most sales is the hour to post in and
 * the hour to send a letter at.
 */
const SERIES = "#0E8C7D";
const DAYS = ["пн", "вт", "ср", "чт", "пт", "сб", "нд"];

/** The best three consecutive hours, wrapping past midnight. */
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

export function WhenChart({ byHour, byWeekday }: Pick<DashboardData, "byHour" | "byWeekday">) {
  const maxHour = Math.max(1, ...byHour);
  const maxDay = Math.max(1, ...byWeekday);
  const total = byHour.reduce((a, b) => a + b, 0);
  const window = bestWindow(byHour);
  const topDay = byWeekday.indexOf(maxDay);

  return (
    <section className="rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
      <h2 className="text-lg font-bold tracking-tight text-bh-ink">Кога купуват</h2>
      <p className="mt-1 text-sm text-bh-ink/55">Платените поръчки по час и по ден от седмицата, софийско време.</p>

      {total === 0 ? (
        <p className="py-10 text-center text-sm text-bh-ink/50">Ще се появи с първите платени поръчки.</p>
      ) : (
        <>
          {/* The bars need a parent with a real height for their percentages
              to mean anything, so the hour labels sit in their own row. */}
          <div className="mt-5 flex h-32 items-end gap-[3px]">
            {byHour.map((n, h) => {
              const inWindow = window ? (h - window.from + 24) % 24 < 3 : false;
              return (
                <div
                  key={h}
                  className="w-full rounded-t-[3px]"
                  title={`${hh(h)} · ${n} ${n === 1 ? "поръчка" : "поръчки"}`}
                  style={{
                    height: `${Math.max(n ? 8 : 2, (n / maxHour) * 100)}%`,
                    background: n === 0 ? "#0b2a2214" : inWindow ? SERIES : "#0E8C7D66",
                  }}
                />
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-[3px]">
            {byHour.map((_, h) => (
              <span key={h} className="w-full text-center text-[0.55rem] tabular-nums text-bh-ink/40">
                {h % 3 === 0 ? h : ""}
              </span>
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            {byWeekday.map((n, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-14 w-full items-end rounded-lg bg-bh-ink/5">
                  <div
                    className="w-full rounded-lg"
                    style={{ height: `${Math.max(n ? 8 : 0, (n / maxDay) * 100)}%`, background: i === topDay ? SERIES : "#0E8C7D55" }}
                  />
                </div>
                <span className={`text-[0.62rem] ${i === topDay ? "font-semibold text-bh-ink" : "text-bh-ink/45"}`}>{DAYS[i]}</span>
              </div>
            ))}
          </div>

          {window && (
            <p className="mt-5 border-t border-bh-ink/8 pt-4 text-sm leading-relaxed text-bh-ink/70">
              Най-много поръчки идват между <strong className="font-semibold text-bh-ink">{hh(window.from)} и {hh(window.to)}</strong>{" "}
              - {window.share}% от всички - и в <strong className="font-semibold text-bh-ink">{["понеделник", "вторник", "сряда", "четвъртък", "петък", "събота", "неделя"][topDay]}</strong>.
              Пускай постовете и писмата около час преди това.
            </p>
          )}
        </>
      )}
    </section>
  );
}
