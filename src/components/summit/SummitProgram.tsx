import { Reveal } from "@/components/ui/Reveal";
import { PROGRAM } from "@/lib/program";
import { announcedSpeakers } from "@/lib/speakers";

/**
 * Hosts and the team - public from day one, not part of the weekly speaker
 * reveals, so the sessions they present keep their names.
 */
const HOSTS = [
  "Мария Силвестър",
  "Мария Илиева",
  "Диана Радева",
  "Мария Варсанова",
  "Джулия Димитрова",
];

/** "проф. Иво Петров" and "Иво Петров" must compare equal. */
function bare(name: string): string {
  return name
    .replace(/^(проф\.|доц\.|д-р)\s+/i, "")
    .replace(/,.*$/, "")
    .trim()
    .toLowerCase();
}

export function SummitProgram() {
  // The full line-up lives in program.ts, but only announced names render.
  // Printing everyone here would spoil the weekly reveals the speaker section
  // holds back - the schedule and the announcement have to keep one secret.
  const allowed = new Set([
    ...announcedSpeakers().map((s) => bare(s.name)),
    ...HOSTS.map(bare),
  ]);
  const isAllowed = (n: string) => allowed.has(bare(n));

  return (
    <section id="program" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="flex flex-col gap-6 border-t border-bh-ink/15 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="bh-eyebrow font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              Програма
            </p>
            <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.5rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
              Два дни, един голям въпрос
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-bh-ink/60">
            Как да превърнем повече години в повече живот? Сцената, движението
            и възстановяването вървят паралелно през целия ден, със записване
            на час.
          </p>
        </Reveal>

        <div className="mt-12 grid items-start gap-4 lg:grid-cols-2">
          {PROGRAM.map((d, i) => (
            <Reveal key={d.date} delay={i * 120}>
              <div className="bh-mint h-full overflow-hidden rounded-3xl">
                <div className="bh-day-header bg-bh-ink px-7 py-6 text-bh-paper">
                  <div className="flex items-baseline gap-3">
                    <span className="text-xl font-black uppercase tracking-tight">
                      {d.day}
                    </span>
                    <span className="font-mono text-sm text-bh-lime">
                      {d.date}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-bh-paper/55">
                    {d.theme}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-bh-paper/70">
                    {d.intro}
                  </p>
                </div>

                <ul>
                  {d.slots.map((slot, j) => (
                    <li
                      key={`${slot.time}-${slot.title}`}
                      className={`flex gap-4 px-7 py-4 transition-colors hover:bg-bh-pine/10 ${
                        j !== 0 ? "border-t border-bh-ink/8" : ""
                      } ${slot.pause ? "bg-bh-ink/[0.03]" : ""}`}
                    >
                      <span className="w-[5.5rem] shrink-0 pt-0.5 font-mono text-[0.7rem] leading-relaxed text-bh-ink/45">
                        {slot.time}
                      </span>

                      <div className="min-w-0">
                        <p
                          className={`text-sm leading-snug ${
                            slot.pause
                              ? "font-medium text-bh-ink/55"
                              : "font-semibold text-bh-ink"
                          }`}
                        >
                          {slot.title}
                        </p>

                        {slot.note && !slot.pause && (
                          <p className="mt-1.5 text-xs leading-relaxed text-bh-ink/55">
                            {slot.note}
                          </p>
                        )}

                        {slot.role &&
                          (!slot.role.includes(":") ||
                            isAllowed(slot.role.split(":")[1])) && (
                            <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-bh-ink/40">
                              {slot.role}
                            </p>
                          )}

                        {slot.people &&
                          (() => {
                            const shown = slot.people.filter(isAllowed);
                            const hidden = slot.people.length - shown.length;
                            if (!shown.length && !hidden) return null;
                            return (
                              <p className="mt-1 text-xs font-medium leading-snug text-bh-pine">
                                {shown.join(" · ")}
                                {hidden > 0 && (
                                  <span className="text-bh-ink/40">
                                    {shown.length > 0 ? " · " : ""}
                                    {hidden === 1
                                      ? "гост, когото обявяваме скоро"
                                      : `${hidden} гости, които обявяваме скоро`}
                                  </span>
                                )}
                              </p>
                            );
                          })()}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        {/* The organisers' own caveat, carried across rather than dropped.
            A published schedule reads as a commitment, and both the line-up
            and the times are still being confirmed. */}
        <p className="mt-6 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-bh-ink/40">
          Предварителна програма · подлежи на финално потвърждение на лектори и
          часови диапазони.
        </p>
      </div>
    </section>
  );
}
