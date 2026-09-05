import { Reveal } from "@/components/ui/Reveal";
import { SpeakerGrid } from "@/components/summit/SpeakerGrid";
import type { Lang } from "@/lib/i18n";
import { ListForm } from "@/components/summit/ListForm";
import { LIST, SPEAKERS_SECTION } from "@/lib/site-copy";
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

        {/* Someone who has just read the line-up and is not buying today has
            one reason left to leave an address. It stands here rather than
            beside the ticket cards, where a free option costs sales. */}
        <Reveal className="mt-14">
          <div className="bh-forest rounded-3xl p-8 text-bh-paper sm:p-10">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bh-paper/50">
              {LIST[lang].eyebrow}
            </p>
            <h3 className="mt-3 max-w-xl text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
              {LIST[lang].title}
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-bh-paper/70">
              {LIST[lang].body}
            </p>
            <ListForm lang={lang} source="speakers-section" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
