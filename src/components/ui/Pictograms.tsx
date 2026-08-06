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
