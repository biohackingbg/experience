import { Reveal } from "@/components/ui/Reveal";
import { PARTNERS, type Partner } from "@/lib/partners";

/**
 * The confirmed partners.
 *
 * Deliberately count-driven. A grid built for twelve with three logos in it
 * reads as failure, so the tile width comes from how many partners there
 * actually are: one or two get a wide statement row, three fill the row, and
 * only from six does it become a wall. Nothing renders at all until the first
 * signature - an empty partner section on a page selling tickets says "nobody
 * backs this".
 *
 * Dark green section, because a band of logos needs to sit apart from the
 * editorial around it. Marks stay in their own colours on a light tile unless
 * the partner supplied a white version; recolouring somebody else's logo is
 * not ours to do.
 */
function tileWidth(count: number): string {
  if (count <= 2) return "w-full sm:w-[calc(50%-0.5rem)]";
  if (count === 3) return "w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)]";
  if (count <= 5) return "w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(20%-0.8rem)]";
  return "w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)]";
}

function Tile({ partner, tall }: { partner: Partner; tall: boolean }) {
  // A fixed-height box the artwork is fitted into, rather than a height cap on
  // the image itself: marks come in wildly different shapes, and a wide
  // wordmark next to a square mark must not read as half the brand. Width
  // binds first for the wide ones, height for the square ones. It also means
  // the tile is the right size before the file has loaded, which a bare
  // `w-auto` is not.
  const fit = `${tall ? "h-16" : "h-12"} w-full max-w-[11rem] object-contain`;

  const inner = partner.logoLight ? (
    // Their own white version: straight onto the green, no plate.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={partner.logoLight} alt={partner.name} loading="lazy" className={fit} />
  ) : partner.logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={partner.logo} alt={partner.name} loading="lazy" className={fit} />
  ) : (
    // Signed, artwork not in yet. The name set large is a real placeholder,
    // not an apology - it says who, which is the whole point of the section.
    <span className="text-center text-lg font-bold leading-tight tracking-tight">
      {partner.name}
    </span>
  );

  const onPlate = !partner.logoLight;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl px-5 ${
        tall ? "min-h-[9rem] py-7" : "min-h-[7rem] py-6"
      } ${
        onPlate
          ? "bg-white text-[#02251F] ring-1 ring-white/60"
          : "bg-white/5 text-[#f2f2ee] ring-1 ring-white/15"
      }`}
    >
      {inner}
      {partner.role && (
        <span
          className={`text-center font-mono text-[0.58rem] uppercase tracking-[0.15em] ${
            onPlate ? "text-[#02251F]/55" : "text-[#f2f2ee]/60"
          }`}
        >
          {partner.role}
        </span>
      )}
    </div>
  );
}

export function SummitPartners() {
  const count = PARTNERS.length;
  if (count === 0) return null;

  const width = tileWidth(count);
  const tall = count <= 3;

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

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {PARTNERS.map((p, i) => (
            <Reveal key={p.name} delay={i * 60} className={width}>
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="sponsored nofollow noopener noreferrer"
                  title={p.name}
                  className="block h-full transition-transform duration-300 hover:-translate-y-1"
                >
                  <Tile partner={p} tall={tall} />
                </a>
              ) : (
                <Tile partner={p} tall={tall} />
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
