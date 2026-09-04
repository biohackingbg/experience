import { Reveal } from "@/components/ui/Reveal";
import { SponsorWall } from "@/components/summit/SponsorWall";
import type { Lang } from "@/lib/i18n";
import { SPONSORS_SECTION } from "@/lib/site-copy";
import { EXHIBITORS, ZONE_SPONSORS, type ZoneSponsor } from "@/lib/sponsors";

function ZoneCard({ s, lang }: { s: ZoneSponsor; lang: Lang }) {
  const c = SPONSORS_SECTION[lang];
  const body = (
    <>
      <p className="bh-eyebrow font-mono text-[0.62rem] uppercase tracking-[0.2em] text-bh-ink/45">
        {c.zoneSponsor}
      </p>
      <h3 className="mt-2 font-display text-3xl font-[900] uppercase leading-none tracking-tight text-bh-ink">
        {s.zone}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-bh-ink/55">
        {c.blurbs[s.zone] ?? ""}
      </p>

      <div className="mt-8 flex flex-1 items-end">
        {s.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.logo}
            alt={s.name}
            className="max-h-16 w-auto max-w-[70%] object-contain object-left"
          />
        ) : (
          <span className="text-xl font-bold leading-tight tracking-tight text-bh-ink">
            {s.name}
          </span>
        )}
      </div>
    </>
  );

  const shell =
    "bh-mint flex h-full flex-col rounded-3xl p-8 transition-transform duration-300";

  return s.url ? (
    <a
      href={s.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={`${shell} hover:-translate-y-1.5`}
    >
      {body}
    </a>
  ) : (
    <div className={shell}>{body}</div>
  );
}

/**
 * Partners.
 *
 * Renders nothing at all until something is signed. A grid of empty slots on
 * the page that sells the tickets says "nobody backs this", and the dashed
 * "your logo here" placeholder belongs in the sales deck, not here.
 */
export function SummitSponsors({ lang = "bg" }: { lang?: Lang }) {
  const c = SPONSORS_SECTION[lang];
  if (ZONE_SPONSORS.length === 0 && EXHIBITORS.length === 0) return null;

  return (
    <section id="partniori" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Reveal className="flex flex-col gap-6 border-t border-bh-ink/15 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="bh-eyebrow font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              {c.eyebrow}
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
              {c.title}
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-bh-ink/60">
            {c.intro}
          </p>
        </Reveal>

        {ZONE_SPONSORS.length > 0 && (
          <Reveal className="mt-10">
            <div
              className={`grid gap-4 ${
                ZONE_SPONSORS.length === 1
                  ? "sm:grid-cols-1"
                  : ZONE_SPONSORS.length === 2
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {ZONE_SPONSORS.map((s) => (
                <ZoneCard key={s.zone} s={s} lang={lang} />
              ))}
            </div>
          </Reveal>
        )}

        {EXHIBITORS.length > 0 && (
          <>
            <Reveal className="mt-14">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/45">
                {c.village(EXHIBITORS.length)}
              </p>
            </Reveal>
            <Reveal className="mt-5">
              <SponsorWall exhibitors={EXHIBITORS} />
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}
