/**
 * Country marks for the speaker cards.
 *
 * Drawn rather than typed as emoji: Chrome and Firefox on Windows ship no
 * glyphs for the regional-indicator pairs, so an emoji flag degrades to the
 * bare letters ("CH") for a large share of the audience. These render the same
 * everywhere.
 *
 * A country with no flag here falls back to its name in text, so adding a
 * speaker from a new country never silently drops the information — see
 * CountryMark below.
 */

const FLAGS: Record<string, React.ReactNode> = {
  България: (
    <>
      <rect width="24" height="6" fill="#fff" />
      <rect y="6" width="24" height="6" fill="#00966E" />
      <rect y="12" width="24" height="6" fill="#D62612" />
    </>
  ),
  Малта: (
    <>
      <rect width="24" height="18" fill="#fff" />
      <rect x="12" width="12" height="18" fill="#CF142B" />
    </>
  ),
  Австрия: (
    <>
      <rect width="24" height="18" fill="#ED2939" />
      <rect y="6" width="24" height="6" fill="#fff" />
    </>
  ),
  САЩ: (
    <>
      <rect width="24" height="18" fill="#B22234" />
      {/* Six white stripes over red gives the thirteen. The stars are dropped
          on purpose — at 18px wide they collapse into noise. */}
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect
          key={i}
          y={(i * 18) / 13}
          width="24"
          height={18 / 13}
          fill="#fff"
        />
      ))}
      <rect width="9.6" height={(7 * 18) / 13} fill="#3C3B6E" />
    </>
  ),
  Швеция: (
    <>
      <rect width="24" height="18" fill="#006AA7" />
      <rect y="7.2" width="24" height="3.6" fill="#FECC02" />
      <rect x="7.2" width="3.6" height="18" fill="#FECC02" />
    </>
  ),
  Швейцария: (
    <>
      <rect width="24" height="18" fill="#D52B1E" />
      <rect x="10.2" y="3.6" width="3.6" height="10.8" fill="#fff" />
      <rect x="6.6" y="7.2" width="10.8" height="3.6" fill="#fff" />
    </>
  ),
};

/**
 * Shows the flag when one is drawn for that country, otherwise the country
 * name set small — never nothing.
 */
export function CountryMark({ country }: { country: string }) {
  const flag = FLAGS[country];

  if (!flag) {
    return (
      <span className="mt-0.5 shrink-0 font-mono text-[0.58rem] uppercase tracking-[0.1em] opacity-55">
        {country}
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 24 18"
      role="img"
      aria-label={country}
      className="mt-1 h-[0.85rem] w-[1.13rem] shrink-0 overflow-hidden rounded-[0.15rem]"
    >
      <title>{country}</title>
      {flag}
      {/* Keeps the white band of the Bulgarian flag from bleeding into a
          light card. */}
      <rect
        width="24"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
    </svg>
  );
}
