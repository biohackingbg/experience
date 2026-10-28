import { Reveal } from "@/components/ui/Reveal";
import type { Lang } from "@/lib/i18n";
import { latin } from "@/lib/latin";
import { MOVEMENT_DAYS, STATIONS, type MoveSlot } from "@/lib/movement-program";
import { MOVEMENT_SECTION, PROGRAM_SECTION } from "@/lib/site-copy";

const DATES = ["07.11", "08.11"];

/**
 * The rooms and stations beside the stage: yoga, mobility and reformer
 * classes in Newton and Columbus 1, three workshops, and the recovery
 * stations. Same look as the stage programme above it, so the two read as
 * one timetable.
 */
export function SummitMovement({ lang = "bg" }: { lang?: Lang }) {
  const c = MOVEMENT_SECTION[lang];
  const days = PROGRAM_SECTION[lang].days;

  const who = (s: MoveSlot) =>
    [
      s.host ? `${c.withHost} ${lang === "en" ? latin(s.host) : s.host}` : null,
      s.by,
      c.seats(s.seats, s.upTo),
    ]
      .filter(Boolean)
      .join(", ");

  return (
    <section id="movement" className="px-5 pt-20 sm:px-8 sm:pt-24 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="flex flex-col gap-6 border-t border-bh-ink/15 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="bh-eyebrow font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">{c.eyebrow}</p>
            <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
              {c.title}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-bh-ink/60">{c.intro}</p>
        </Reveal>

        <div className="mt-12 grid items-start gap-4 lg:grid-cols-2">
          {MOVEMENT_DAYS.map((rooms, i) => (
            <Reveal key={DATES[i]} delay={i * 120}>
              <div className="bh-mint h-full overflow-hidden rounded-3xl">
                <div className="bh-day-header bg-bh-ink px-7 py-6 text-bh-paper">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-xl font-[900] uppercase tracking-tight">{days[i]?.day}</span>
                    <span className="font-mono text-sm text-bh-lime">{DATES[i]}</span>
                  </div>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-bh-paper/55">{c.rooms}</p>
                </div>

                {rooms.map((r) => (
                  <div key={r.room}>
                    <div className="border-t border-bh-ink/8 bg-bh-ink/[0.05] px-7 py-3">
                      <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.12em] text-bh-pine">{r.room}</p>
                    </div>
                    <ul>
                      {r.slots.map((s) => (
                        <li
                          key={`${r.room}-${s.time}-${s.title}`}
                          className="flex gap-4 border-t border-bh-ink/8 px-7 py-4 transition-colors hover:bg-bh-pine/10"
                        >
                          <span className="w-[5.5rem] shrink-0 pt-0.5 font-mono text-[0.7rem] leading-relaxed text-bh-ink/45">{s.time}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold leading-snug text-bh-ink">
                              {lang === "en" && s.titleEn ? s.titleEn : s.title}
                              {s.workshop && (
                                <span className="ml-2 whitespace-nowrap rounded-full border border-bh-pine/40 px-2 py-0.5 align-middle font-mono text-[0.58rem] font-medium uppercase tracking-[0.12em] text-bh-pine">
                                  {c.workshop}
                                </span>
                              )}
                            </p>
                            <p className="mt-1 text-xs font-medium leading-snug text-bh-pine">{who(s)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">{c.stations}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATIONS.map((st) => (
              <div key={st.items.map((it) => it.name).join("+")} className="bh-mint flex flex-col rounded-3xl p-6">
                <span className="self-start rounded-full border border-bh-ink/30 px-3 py-1 font-mono text-[0.62rem] font-medium uppercase tracking-[0.12em] text-bh-ink/70">
                  {st.zone}
                </span>
                {st.items.map((it) => (
                  <div key={it.name} className="mt-4 first:mt-5">
                    <p className="font-display text-lg font-[900] uppercase leading-tight tracking-tight text-bh-ink">{it.name}</p>
                    {it.sub && <p className="mt-1 text-xs leading-relaxed text-bh-ink/60">{it.sub[lang]}</p>}
                  </div>
                ))}
                {(st.facts || st.note) && (
                  <div className="mt-auto pt-5">
                    {st.facts && <p className="text-sm font-semibold text-bh-ink">{st.facts[lang]}</p>}
                    {st.note && <p className="mt-1 text-xs leading-relaxed text-bh-ink/60">{st.note[lang]}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
