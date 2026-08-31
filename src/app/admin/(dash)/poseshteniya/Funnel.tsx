import type { FunnelStep } from "@/lib/site-views";

/**
 * The path from "opened the site" to "paid", each step drawn as a share of
 * the first one, with the drop-off named between them.
 *
 * The percentage on a step is of the step *above* it, not of the total - that
 * is the number that says where people are lost, which is the only reason to
 * look at a funnel at all.
 */
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = steps[0]?.value ?? 0;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold tracking-tight text-bh-ink">
        От посетител до платен билет
      </h2>
      <p className="mt-1 text-sm text-bh-ink/55">
        Процентът на всяка стъпка е спрямо стъпката над нея - там се вижда къде
        се губят хората.
      </p>

      <div className="mt-5 flex flex-col gap-2">
        {steps.map((s, i) => {
          const width = top ? Math.max((s.value / top) * 100, s.value > 0 ? 8 : 3) : 3;
          const lost = i > 0 ? (steps[i - 1]?.value ?? 0) - s.value : 0;

          return (
            <div key={s.label}>
              {i > 0 && (
                <p className="mb-1.5 ml-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bh-ink/45">
                  {lost > 0 ? `↓ отпадат ${lost}` : "↓"}
                </p>
              )}
              <div className="relative overflow-hidden rounded-2xl bg-bh-cloud ring-1 ring-bh-ink/8">
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-[#0E8C7D]/15"
                  style={{ width: `${width}%` }}
                />
                <div className="relative flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-4">
                  <div>
                    <span className="text-base font-bold text-bh-ink">{s.label}</span>
                    <span className="ml-3 text-xs text-bh-ink/55">{s.hint}</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-black tracking-tight text-bh-ink">{s.value}</span>
                    {s.ofPrev !== null && (
                      <span className="rounded-full bg-bh-ink/10 px-2.5 py-1 text-xs font-semibold text-bh-ink/70">
                        {s.ofPrev}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
