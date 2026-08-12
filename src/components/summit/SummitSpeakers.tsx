import { Reveal } from "@/components/ui/Reveal";
import { initials, SPEAKERS } from "@/lib/speakers";

/**
 * One card per speaker: portrait, then a dedicated text block below it for
 * title, name, country and topic. A MasterClass-style card only has to carry
 * a first name; ours carries a medical title, an affiliation and often a
 * foreign country, so that information gets its own block instead of being
 * squeezed into an image caption.
 */
export function SummitSpeakers() {
  return (
    <section id="lektori" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="flex flex-col gap-6 border-t border-bh-ink/15 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="bh-eyebrow font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              Лектори
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
              Международни имена, на разбираем език
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-bh-ink/60">
            Лекари и изследователи от България и чужбина. Програмата се
            допълва — обявяваме нови имена всяка седмица.
          </p>
        </Reveal>

        <div className="mt-10 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:px-0 sm:[scrollbar-width:thin]">
          {SPEAKERS.map((s, i) => (
            <Reveal
              key={s.id}
              delay={i * 70}
              className="w-[15.5rem] shrink-0 snap-start sm:w-[16.5rem]"
            >
              <article
                className={`flex h-full flex-col overflow-hidden rounded-3xl ring-1 transition-transform duration-300 ${
                  s.pending
                    ? "bg-bh-cloud ring-bh-ink/8"
                    : "bg-bh-ink text-bh-paper ring-bh-ink/8 hover:-translate-y-1.5"
                }`}
              >
                {/* Portrait */}
                <div
                  className={`relative flex aspect-[3/4] items-center justify-center ${
                    s.pending ? "bg-bh-stone" : "bg-bh-forest"
                  }`}
                >
                  {s.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.photo}
                      alt={s.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : s.pending ? (
                    <span className="text-3xl text-bh-ink/25" aria-hidden>
                      ✳
                    </span>
                  ) : (
                    <span className="font-display text-4xl font-[900] text-bh-paper/30">
                      {initials(s.name)}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col gap-2 p-5">
                  {s.pending ? (
                    <p className="font-mono text-xs uppercase tracking-[0.15em] text-bh-ink/45">
                      {s.name}
                    </p>
                  ) : (
                    <>
                      {s.title && (
                        <p className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-lime">
                          {s.title}
                        </p>
                      )}
                      <h3 className="text-lg font-bold leading-tight tracking-tight">
                        {s.name}
                      </h3>
                      {s.specialty && (
                        <p className="text-sm font-medium text-bh-paper/90">
                          {s.specialty}
                        </p>
                      )}
                      {(s.affiliation || s.country) && (
                        <p className="text-xs leading-snug text-bh-paper/60">
                          {s.affiliation}
                          {s.affiliation && s.country ? " · " : ""}
                          {s.country}
                        </p>
                      )}
                      {s.topic && (
                        <p className="mt-1 text-sm leading-snug text-bh-paper/80">
                          {s.topic}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
