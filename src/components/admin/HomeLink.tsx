import Link from "next/link";

/**
 * The way back to the admin front page from every other admin page.
 *
 * It used to be "← Табло" set small in mono - a label that meant something
 * to whoever named the page and nothing to a colleague opening it for the
 * first time. A house is the one symbol everyone reads as "start", and the
 * word next to it says the same thing in Bulgarian, so neither has to carry
 * the meaning alone. Drawn as a real button rather than a text link so it
 * is found without hunting.
 */
export function HomeLink() {
  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-2 rounded-full border border-bh-ink/20 px-4 py-2 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink hover:bg-bh-cloud"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="h-4 w-4 shrink-0"
        aria-hidden
      >
        <path
          d="M3 9.5 10 3.5l7 6V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1V9.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
      Начало
    </Link>
  );
}
