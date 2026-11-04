import { Reveal } from "@/components/ui/Reveal";
import type { Lang } from "@/lib/i18n";
import { latin } from "@/lib/latin";
import { type Backer, MOVEMENT_DAYS, type MoveSlot, STATIONS, WORKSHOPS } from "@/lib/movement-program";
import { MOVEMENT_SECTION, PROGRAM_SECTION } from "@/lib/site-copy";

const DATES = ["07.11", "08.11"];

/** "powered by <logo>" on an ink pill, so a white wordmark reads on the mint card in both themes. */
function PoweredBy({ partner, label }: { partner: Backer; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-bh-ink py-1.5 pl-3 pr-2.5 text-[0.62rem] font-medium uppercase tracking-[0.1em] text-bh-paper/80">
      {label}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={partner.logo} alt={partner.name} className={`${partner.h ?? "h-3.5"} w-auto`} />
    </span>
  );
}

/**
 * The rooms and stations beside the stage, in the two groups a ticket books
 * separately: the workshops (five, in Newton) and the experiences - the
 * classes in Newton and Columbus 1 and the recovery stations. Same look as
 * the stage programme above it, so the two read as one timetable.
 */
export function SummitMovement({ lang = "bg" }: { lang?: Lang }) {
  const c = MOVEMENT_SECTION[lang];
  const days = PROGRAM_SECTION[lang].days;
  const name = (s: string) => (lang === "en" ? latin(s) : s);

  const who = (s: MoveSlot) => [s.host ? `${c.withHost} ${name(s.host)}` : null, s.by, c.seats(s.seats, s.upTo)].filter(Boolean).join(", ");

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

        <Reveal className="mt-12">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">{c.workshops}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WORKSHOPS.map((w) => (
              <div key={`${w.day}-${w.time}`} className="bh-mint flex flex-col rounded-3xl p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-bh-ink px-3 py-1 font-mono text-[0.62rem] font-medium uppercase tracking-[0.12em] text-bh-lime">
                    {days[w.day]?.day} {DATES[w.day]}
                  </span>
                  <span className="font-mono text-[0.7rem] text-bh-ink/55">{w.time}</span>
                </div>
                <p className="mt-5 font-display text-lg font-[900] uppercase leading-tight tracking-tight text-bh-ink">
                  {lang === "en" && w.titleEn ? w.titleEn : w.title}
                </p>
                <p className="mt-auto pt-5 text-xs font-medium leading-snug text-bh-pine">{who(w)}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-12">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">{c.experiences}</p>
        </Reveal>
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
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
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-bh-ink/8 bg-bh-ink/[0.05] px-7 py-3">
                      <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.12em] text-bh-pine">{r.room}</p>
                      {r.partner && <PoweredBy partner={r.partner} label={r.partner.label} />}
                    </div>
                    <ul>
                      {/* The workshops have their own cards above; here the room shows what else it runs. */}
                      {r.slots
                        .filter((s) => !s.workshop)
                        .map((s) => (
                          <li
                            key={`${r.room}-${s.time}-${s.title}`}
                            className="flex gap-4 border-t border-bh-ink/8 px-7 py-4 transition-colors hover:bg-bh-pine/10"
                          >
                            <span className="w-[5.5rem] shrink-0 pt-0.5 font-mono text-[0.7rem] leading-relaxed text-bh-ink/45">{s.time}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold leading-snug text-bh-ink">{lang === "en" && s.titleEn ? s.titleEn : s.title}</p>
                              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium leading-snug text-bh-pine">
                                {who(s)}
                                {s.partner && <PoweredBy partner={s.partner} label={c.poweredBy} />}
                              </p>
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-bh-ink/30 px-3 py-1 font-mono text-[0.62rem] font-medium uppercase tracking-[0.12em] text-bh-ink/70">
                    {st.zone}
                  </span>
                </div>
                {st.items.map((it) => (
                  <div key={it.name} className="mt-4 first:mt-5">
                    <p className="font-display text-lg font-[900] uppercase leading-tight tracking-tight text-bh-ink">{it.name}</p>
                    {it.sub && <p className="mt-1 text-xs leading-relaxed text-bh-ink/60">{it.sub[lang]}</p>}
                  </div>
                ))}
                {st.partner && (
                  <div className="mt-4">
                    <PoweredBy partner={st.partner} label={c.poweredBy} />
                  </div>
                )}
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
