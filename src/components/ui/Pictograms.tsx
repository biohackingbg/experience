/**
 * Line pictograms drawn to sit beside the asterisk mark: one weight, no fills,
 * a 24 grid, round caps. They read as a family because the stroke never
 * changes — only the geometry does.
 */

type Props = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** The existing mark, as an SVG so it lines up with the rest. */
export function Asterisk({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3v18M3.8 7.5l16.4 9M20.2 7.5L3.8 16.5" />
    </svg>
  );
}

/** Venue. A building with a canopy — abstract enough not to read as a house. */
export function Hotel({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3 21h18" />
      <path d="M5 21V8.4a1 1 0 0 1 .6-.9l6-2.7a1 1 0 0 1 1.4.9V21" />
      <path d="M13 12h5.4a1 1 0 0 1 1 1V21" />
      <path d="M8 10.5h1.5M8 14h1.5M8 17.5h1.5M15.8 15.5h1.2M15.8 18.5h1.2" />
    </svg>
  );
}

/** Stage — a mic on its stand. */
export function Stage({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="9.4" y="2.6" width="5.2" height="10.4" rx="2.6" />
      <path d="M6.2 11.4a5.8 5.8 0 0 0 11.6 0" />
      <path d="M12 17.2V21M9 21h6" />
    </svg>
  );
}

/** Laboratory — a flask. */
export function Flask({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M9.5 2.8v6.1L4.6 18a2 2 0 0 0 1.7 3h11.4a2 2 0 0 0 1.7-3l-4.9-9.1V2.8" />
      <path d="M8.2 2.8h7.6" />
      <path d="M7.1 14h9.8" />
    </svg>
  );
}

/** Rituals — heat and water, as rising waves. */
export function Waves({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3 16.5c2.2 0 2.2-1.8 4.5-1.8s2.2 1.8 4.5 1.8 2.2-1.8 4.5-1.8 2.2 1.8 4.5 1.8" />
      <path d="M3 20.4c2.2 0 2.2-1.8 4.5-1.8s2.2 1.8 4.5 1.8 2.2-1.8 4.5-1.8 2.2 1.8 4.5 1.8" />
      <path d="M8.4 10.6c0-2 2-2.4 2-4.2 0-1-.5-1.8-1.2-2.4M14.8 10.6c0-2 2-2.4 2-4.2 0-1-.5-1.8-1.2-2.4" />
    </svg>
  );
}

/** Village — a market stall under its awning. */
export function Stall({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3.4 9.6 5 4.4a1 1 0 0 1 1-.7h12a1 1 0 0 1 1 .7l1.6 5.2" />
      <path d="M3.4 9.6a2.6 2.6 0 0 0 4.3 0 2.6 2.6 0 0 0 4.3 0 2.6 2.6 0 0 0 4.3 0 2.6 2.6 0 0 0 4.3 0" />
      <path d="M5 11.6V21h14v-9.4" />
      <path d="M9.6 21v-5.2h4.8V21" />
    </svg>
  );
}

/* — Longevity passport markers — */

/** Body composition. */
export function Body({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="4.6" r="2.6" />
      <path d="M12 7.6v7.2" />
      <path d="M6.8 10.6c2.2 1.4 3.6 2 5.2 2s3-.6 5.2-2" />
      <path d="m12 14.8-2.8 6.4M12 14.8l2.8 6.4" />
    </svg>
  );
}

/** Functional screening — gait and strength. */
export function Walk({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="13.8" cy="4.2" r="2.2" />
      <path d="m13.4 7 -1.6 5.4 2.8 2.6 1 6" />
      <path d="M11.8 12.4 7.6 10.6" />
      <path d="m11.8 12.4 -3 8.6" />
    </svg>
  );
}

/** Nervous system — heart rate variability. */
export function Pulse({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M2.6 12.4h3.8l1.9-4.8 3.1 9.8 2.5-6.2 1.7 3.4h5.8" />
    </svg>
  );
}

/** Metabolic — blood markers. */
export function Droplet({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.2c3.4 4.3 5.6 7.2 5.6 9.8a5.6 5.6 0 1 1-11.2 0c0-2.6 2.2-5.5 5.6-9.8z" />
      <path d="M9.4 13.4a2.6 2.6 0 0 0 2.6 2.6" />
    </svg>
  );
}

/** Skin and exposome — sun exposure. */
export function SunSkin({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8.2" r="3.4" />
      <path d="M12 1.8v1.6M12 13v1.6M18.4 8.2h-1.6M7.2 8.2H5.6M16.5 3.7l-1.1 1.1M8.6 11.6l-1.1 1.1M16.5 12.7l-1.1-1.1M8.6 4.8 7.5 3.7" />
      <path d="M3.4 18.6c2.2 0 2.2-1.6 4.3-1.6s2.2 1.6 4.3 1.6 2.2-1.6 4.3-1.6 2.2 1.6 4.3 1.6" />
    </svg>
  );
}

/** Senses and cognition. */
export function Eye({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M2.6 12S6.4 5.8 12 5.8 21.4 12 21.4 12 17.6 18.2 12 18.2 2.6 12 2.6 12Z" />
      <circle cx="12" cy="12" r="2.9" />
    </svg>
  );
}

/* — Stats and facts — */

/** Visitors. */
export function People({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="8" r="3.1" />
      <path d="M3.4 20.4c0-3.4 2.5-5.6 5.6-5.6s5.6 2.2 5.6 5.6" />
      <circle cx="17.4" cy="9.2" r="2.3" />
      <path d="M16 14.4c2.9-.4 5.4 1.6 5.4 5" />
    </svg>
  );
}

/** Measurement stations. */
export function Gauge({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3.6 18.4a9 9 0 1 1 16.8 0" />
      <path d="m12 18.4 4.2-5.4" />
      <path d="M12 5.4v1.8M5.6 10.4l1.6.9M18.4 10.4l-1.6.9" />
    </svg>
  );
}

/** Dates. */
export function Calendar({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="3.4" y="5.2" width="17.2" height="15.4" rx="2.2" />
      <path d="M3.4 10.2h17.2M8.2 2.8v4.4M15.8 2.8v4.4" />
      <path d="M7.8 14h2M11 14h2M14.2 14h2M7.8 17.2h2M11 17.2h2" />
    </svg>
  );
}

/** Venue location. */
export function Pin({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M12 21.4s7-6.3 7-11.2a7 7 0 1 0-14 0c0 4.9 7 11.2 7 11.2z" />
      <circle cx="12" cy="10.2" r="2.7" />
    </svg>
  );
}

/** Access / tickets. */
export function TicketIcon({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3 8.6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.8a2.2 2.2 0 0 0 0 4.4v1.8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.8a2.2 2.2 0 0 0 0-4.4V8.6z" />
      <path d="M9.6 8.6v1.6M9.6 13.2v1.6M9.6 17.8v1.2" />
    </svg>
  );
}

/** Medical track. */
export function Stethoscope({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M6.2 2.8v5.4a4.4 4.4 0 0 0 8.8 0V2.8" />
      <path d="M4.6 2.8h3.2M13.4 2.8h3.2" />
      <path d="M10.6 12.6v3a4.6 4.6 0 0 0 9.2 0v-2.2" />
      <circle cx="19.4" cy="10.6" r="2.4" />
    </svg>
  );
}

/** Diagonal arrow, as used on the round buttons. */
export function Arrow({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M7 17L17 7M17 7H8M17 7V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The same arrow turned downward, for "keep scrolling" rather than "leave". */
export function ArrowDown({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 6v12M12 18l-6-6M12 18l6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Station categories ─────────────────────────────────────────────────── */

/** Wearable: a watch face on a strap. */
export function Watch({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="7" y="7" width="10" height="10" rx="2.5" />
      <path d="M9 7V4.5h6V7M9 17v2.5h6V17M12 10v2.5l1.5 1" />
    </svg>
  );
}

/** AI & precision: a neural node cluster. */
export function Neural({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="2.2" />
      <circle cx="5" cy="7" r="1.6" />
      <circle cx="19" cy="7" r="1.6" />
      <circle cx="5" cy="17" r="1.6" />
      <circle cx="19" cy="17" r="1.6" />
      <path d="M6.4 7.8l3.8 2.8M17.6 7.8l-3.8 2.8M6.4 16.2l3.8-2.8M17.6 16.2l-3.8-2.8" />
    </svg>
  );
}

/** Supplement: a capsule. */
export function Capsule({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="9" width="17" height="6" rx="3" transform="rotate(-35 12 12)" />
      <path d="M9.6 8.4l4.8 7.2" />
    </svg>
  );
}

/** Medical technology: a chip with a heartbeat. */
export function Chip({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M8.5 12h2l1-2 1.5 4 1-2h1.5M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3" />
    </svg>
  );
}

/** Women's health: a heart held in a curve. */
export function Heart({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M12 20s-7-4.4-7-9.6A3.9 3.9 0 0 1 12 8.2a3.9 3.9 0 0 1 7 2.2c0 5.2-7 9.6-7 9.6z" />
    </svg>
  );
}

/** Functional testing: a test tube with a reading. */
export function TestTube({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M9 3h6M10 3v11.5a2 2 0 1 0 4 0V3M10 10h4" />
    </svg>
  );
}

/**
 * DNA: the familiar helix — two gentle strands weaving through one and a
 * half turns, rungs where they part. Wide, soft crossings so it survives at
 * icon size instead of collapsing into an X.
 */
export function Dna({ className }: Props) {
  return (
    <svg {...base} className={className}>
      {/* Two strands, each a full S: open at the top, crossing twice, open
          at the bottom — the wide bulge in the middle carries two rungs,
          the open ends one each. */}
      <path d="M6.5 2.5C6.5 6.5 17.5 8 17.5 12S6.5 17.5 6.5 21.5" />
      <path d="M17.5 2.5C17.5 6.5 6.5 8 6.5 12S17.5 17.5 17.5 21.5" />
      <path d="M8.6 4.8h6.8M7.7 10.4h8.6M7.7 13.6h8.6M8.6 19.2h6.8" />
    </svg>
  );
}

/** Diagonal arrow pointing down-left: "the thing you want is below, on the left". */
export function ArrowDownLeft({ className }: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M17 7L7 17M7 17h9M7 17V8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
