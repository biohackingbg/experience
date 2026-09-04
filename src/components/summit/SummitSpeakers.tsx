import { Reveal } from "@/components/ui/Reveal";
import { SpeakerGrid } from "@/components/summit/SpeakerGrid";
import type { Lang } from "@/lib/i18n";
import { SPEAKERS_SECTION } from "@/lib/site-copy";
import { getAnnouncedSpeakers } from "@/lib/speakers-data";

/**
 * A grid rather than a horizontal strip. The strip cost less height but hid
 * people: most visitors never swipe, and a line-up of doctors is something you
 * compare - you scan specialities against each other, which only works when
 * they sit side by side. Height is held down by the square crop and by
 * revealing the first eight, the rest on request.
 */
export async function SummitSpeakers({ lang = "bg" }: { lang?: Lang }) {
  const speakers = await getAnnouncedSpeakers(lang);
  const c = SPEAKERS_SECTION[lang];
  return (
    <section id="lektori" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
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

        <Reveal className="mt-10">
          <SpeakerGrid speakers={speakers} lang={lang} />
        </Reveal>

      </div>
    </section>
  );
}
