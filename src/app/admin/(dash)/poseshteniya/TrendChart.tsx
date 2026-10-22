import type { DayRow, TrafficReport } from "@/lib/traffic";

const eur = (cents: number) =>
  new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);

const dm = (day: string) => {
  const [, m, d] = day.split("-");
  return `${Number(d)}.${Number(m)}`;
};

/** Seven-day moving mean, so one slow Sunday does not read as a trend. */
function movingAverage(values: number[], window = 7): number[] {
  return values.map((_, i) => {
    const from = Math.max(0, i - window + 1);
    const slice = values.slice(from, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

/**
 * Visitors above, tickets sold below, one column per day on a shared axis:
 * the point is to see a post or an advert as a bump in the first row and,
 * a little later, in the second. Today is drawn paler - it is not finished,
 * and a full-height comparison with finished days would call it a dip.
 */
export function DaysChart({ data }: { data: DayRow[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-bh-ink/50">Още няма данни за този период.</p>;
  }
  const maxV = Math.max(1, ...data.map((d) => d.visitors));
  const maxT = Math.max(1, ...data.map((d) => d.tickets));
  const avg = movingAverage(data.map((d) => d.visitors));
  const pts = avg.map((v, i) => `${((i + 0.5) / data.length) * 100},${100 - (v / maxV) * 100}`).join(" ");
  const labelEvery = data.length <= 14 ? 1 : data.length <= 45 ? 5 : data.length <= 120 ? 14 : 30;

  return (
    <div>
      <div className="relative">
        <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-bh-ink/45">Посетители на ден · пик {maxV}</p>
        <div className="relative flex h-40 items-end gap-[3px]">
          {data.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
              <div
                className={`rounded-t ${d.partial ? "bg-[#0E8C7D]/45" : "bg-[#0E8C7D]"}`}
                style={{ height: `${d.visitors ? Math.max((d.visitors / maxV) * 100, 2) : 0}%` }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-bh-ink px-2.5 py-1.5 text-[0.65rem] leading-snug text-bh-paper group-hover:block">
                <b>{dm(d.day)}{d.partial ? " (до момента)" : ""}</b>
                <br />
                {d.visitors} души · {d.views} отваряния
                <br />
                {d.ticketVisitors} до билетите · {d.tickets} продадени · {eur(d.grossCents)}
              </div>
            </div>
          ))}
          {data.length > 3 && (
            <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
              <polyline points={pts} fill="none" stroke="#02251F" strokeWidth="1.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" opacity="0.7" />
            </svg>
          )}
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-1 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-bh-ink/45">Продадени билети на ден · пик {maxT}</p>
        <div className="flex h-20 items-end gap-[3px]">
          {data.map((d) => (
            <div key={d.day} className="flex h-full flex-1 flex-col justify-end" title={`${dm(d.day)} · ${d.tickets} билета · ${eur(d.grossCents)}`}>
              {d.tickets > 0 ? (
                <div className="rounded-t bg-[#146455]" style={{ height: `${Math.max((d.tickets / maxT) * 100, 6)}%` }} />
              ) : (
                <div className="h-[2px] rounded bg-bh-ink/10" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-1.5 flex gap-[3px]">
        {data.map((d, i) => (
          <div key={d.day} className="flex-1 text-center font-mono text-[0.55rem] text-bh-ink/45">
            {i % labelEvery === 0 || i === data.length - 1 ? dm(d.day) : ""}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-bh-ink/50">Тъмната линия е средното за 7 дни. Мини с мишката върху ден за подробности.</p>
    </div>
  );
}

/** One day by the hour, with the day before as a thin mark on each column. */
export function HoursChart({ data, label, prevLabel }: { data: NonNullable<TrafficReport["hourly"]>; label: string; prevLabel: string }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.cur, d.prev)));
  return (
    <div>
      <div className="flex h-44 items-end gap-[4px]">
        {data.map((d) => (
          <div key={d.hour} className="group relative flex h-full flex-1 flex-col justify-end">
            <div className="relative flex h-full flex-col justify-end">
              <div className="rounded-t bg-[#0E8C7D]" style={{ height: `${d.cur ? Math.max((d.cur / max) * 100, 3) : 0}%` }} />
              {d.prev > 0 && (
                <div
                  aria-hidden
                  className="absolute inset-x-0 h-[3px] rounded bg-bh-ink"
                  style={{ bottom: `calc(${(d.prev / max) * 100}% - 1px)` }}
                />
              )}
            </div>
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-bh-ink px-2.5 py-1.5 text-[0.65rem] leading-snug text-bh-paper group-hover:block">
              <b>{String(d.hour).padStart(2, "0")}:00</b>
              <br />
              {label}: {d.cur} · {prevLabel}: {d.prev}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[4px]">
        {data.map((d) => (
          <div key={d.hour} className="flex-1 text-center font-mono text-[0.55rem] text-bh-ink/45">
            {d.hour % 3 === 0 ? d.hour : ""}
          </div>
        ))}
      </div>
      <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-bh-ink/55">
        <span><i className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-[#0E8C7D] align-middle" />{label}</span>
        <span><i className="mr-1.5 inline-block h-[3px] w-4 rounded bg-bh-ink align-middle" />{prevLabel}</span>
        <span>души на час, българско време</span>
      </p>
    </div>
  );
}
