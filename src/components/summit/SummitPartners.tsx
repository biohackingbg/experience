import { Reveal } from "@/components/ui/Reveal";
import { PARTNERS, type Partner } from "@/lib/partners";

/**
 * The confirmed partners: white marks on the green, no tiles.
 *
 * A wall of little white cards turns eight brands into eight boxes, and the
 * boxes are what the eye sees. Set in one colour on one ground, they read as
 * one group of names instead - which is the thing being said.
 *
 * Deliberately count-driven. A grid built for twelve with three logos in it
 * reads as failure, so the slot width comes from how many there actually are.
 * Nothing renders at all until the first signature: an empty partner section
 * on a page selling tickets says "nobody backs this".
 */
function slotWidth(count: number): string {
  if (count <= 2) return "w-full sm:w-[calc(50%-1.5rem)]";
  if (count === 3) return "w-[calc(50%-1.5rem)] sm:w-[calc(33.333%-2rem)]";
  if (count <= 5) return "w-[calc(50%-1.5rem)] sm:w-[calc(33.333%-2rem)] lg:w-[calc(20%-2.4rem)]";
  return "w-[calc(50%-1.5rem)] sm:w-[calc(33.333%-2rem)] lg:w-[calc(25%-2.25rem)]";
}

function Mark({ partner }: { partner: Partner }) {
  if (!partner.logo) {
    // Signed, artwork not in yet. The name set large is a real placeholder,
    // not an apology - it says who, which is the whole point of the section.
    return (
      <span className="block text-center text-lg font-bold leading-tight tracking-tight text-[#f2f2ee]">
        {partner.name}
      </span>
    );
  }

  // Every file is the same 3:1 canvas with the mark already scaled to match
  // its neighbours' visual weight, so the slot needs no fitting rules of its
  // own - and its dimensions state the ratio, so the row does not jump while
  // the images load.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={partner.logo}
      alt={partner.name}
      width={600}
      height={200}
      loading="lazy"
      className="w-full"
    />
  );
}

export function SummitPartners() {
  const count = PARTNERS.length;
  if (count === 0) return null;

  const width = slotWidth(count);

  return (
    <section id="partniori" className="px-5 pt-24 sm:px-8 sm:pt-32 lg:px-10">
      {/* The band is green in both themes, so its text is written out rather
          than taken from the ink/paper tokens: in dark mode those flip, and
          the heading came out at 1.17:1 - dark green on dark green. */}
      <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-[2rem] bg-[#0a3229] px-5 py-14 sm:px-10 sm:py-16">
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="bh-eyebrow font-mono text-xs uppercase tracking-[0.25em] !text-[#cef870]">
              Партньорите
            </p>
            <h2 className="mt-4 max-w-2xl text-[clamp(2rem,4.5vw,3.5rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-[#f2f2ee]">
              Кой стои зад Sofia Life Summit
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#f2f2ee]/75">
            Брандовете, които вече са потвърдили участие. Списъкът расте до
            ноември.
          </p>
        </Reveal>

        {/* Roomier gaps than a tiled grid needs: with nothing drawn around a
            mark, the empty space is the only thing holding two of them apart. */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-12 gap-y-12">
          {PARTNERS.map((p, i) => (
            <Reveal key={p.name} delay={i * 60} className={width}>
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="sponsored nofollow noopener noreferrer"
                  title={p.name}
                  className="block transition-transform duration-300 hover:-translate-y-1"
                >
                  <Mark partner={p} />
                </a>
              ) : (
                <Mark partner={p} />
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
