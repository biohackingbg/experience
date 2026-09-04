"use client";

import { useState, useSyncExternalStore } from "react";
import type { Lang } from "@/lib/i18n";
import { SPEAKERS_SECTION } from "@/lib/site-copy";
import { initials, type Speaker } from "@/lib/speakers";
import { CountryMark } from "@/components/ui/Flags";

/** How many cards are visible before the visitor asks for the rest. */
const INITIAL = 8;

function SpeakerCard({ s }: { s: Speaker }) {
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-3xl ring-1 transition-transform duration-300 ${
        s.pending
          ? "bg-bh-cloud ring-bh-ink/8"
          : "bg-bh-ink text-bh-paper ring-bh-ink/8 hover:-translate-y-1.5"
      }`}
    >
      {/* Square rather than 3/4: at this many people the portrait is an
          identifier, not a poster, and the shorter crop is what keeps the
          section from running away vertically. */}
      <div
        className={`relative flex aspect-square items-center justify-center ${
          s.pending ? "bg-bh-stone" : "bg-bh-forest"
        }`}
      >
        {s.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.photo}
            alt={s.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top"
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

      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
        {s.pending ? (
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/45">
            {s.name}
          </p>
        ) : (
          <>
            {s.title && (
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.15em] text-bh-lime">
                {s.title}
              </p>
            )}
            {/* Country sits against the name rather than inside the small
                print below: an international line-up should register before
                anything is read. */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-bold leading-tight tracking-tight sm:text-lg">
                {s.name}
              </h3>
              {s.country && <CountryMark country={s.country} />}
            </div>
            {s.specialty && (
              <p className="text-xs font-medium text-bh-paper/90 sm:text-sm">
                {s.specialty}
              </p>
            )}
            {(s.role || s.affiliation) && (
              <p className="line-clamp-3 text-[0.7rem] leading-snug text-bh-paper/60">
                {[s.role, s.affiliation].filter(Boolean).join(", ")}
              </p>
            )}
            {s.topic && (
              <p className="mt-1 text-xs leading-snug text-bh-paper/80">
                {s.topic}
              </p>
            )}
          </>
        )}
      </div>
    </article>
  );
}

/**
 * The front row rotates: every load starts the line-up at a different point,
 * so over a week each speaker gets their turn above the fold instead of the
 * same eight owning it.
 *
 * It rotates rather than shuffles. The order is the programme's, with the
 * opening panel first, and that ordering is worth keeping - only the window
 * onto it moves. Wrapping around means the last cards are not stranded.
 *
 * The server always renders offset 0 (the page is cached, so it could not
 * pick per visitor anyway); the browser picks once per load. Done through
 * useSyncExternalStore so React hydrates against the server value and then
 * re-renders with the browser's - no mismatch, no effect, no setState. The
 * crossfade keeps the move from reading as a glitch; reduced-motion users
 * get the swap alone.
 */
let pick: number | null = null;
const noSubscribe = () => () => {};
function useFrontRowOffset(count: number): { offset: number; settled: boolean } {
  const offset = useSyncExternalStore(
    noSubscribe,
    () => {
      if (pick === null) pick = Math.random();
      return count > INITIAL ? Math.floor(pick * count) : 0;
    },
    () => 0,
  );
  const settled = useSyncExternalStore(noSubscribe, () => true, () => false);
  return { offset, settled };
}

function rotate<T>(list: T[], offset: number, n: number): T[] {
  if (list.length <= n) return list;
  return Array.from({ length: n }, (_, i) => list[(offset + i) % list.length]);
}

export function SpeakerGrid({ speakers, lang = "bg" }: { speakers: Speaker[]; lang?: Lang }) {
  const [expanded, setExpanded] = useState(false);
  const { offset, settled } = useFrontRowOffset(speakers.length);
  const hidden = speakers.length - INITIAL;
  const shown = expanded ? speakers : rotate(speakers, offset, INITIAL);

  return (
    <>
      <div
        className={`grid grid-cols-2 gap-3 transition-opacity duration-500 motion-reduce:transition-none sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 ${
          settled ? "opacity-100" : "opacity-0"
        }`}
      >
        {shown.map((s) => (
          <SpeakerCard key={s.id} s={s} />
        ))}
      </div>

      {hidden > 0 && !expanded && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-full bg-bh-ink px-7 py-3.5 text-sm font-semibold text-bh-paper transition-transform hover:-translate-y-0.5"
          >
            {SPEAKERS_SECTION[lang].showAll(speakers.length)}
          </button>
        </div>
      )}
    </>
  );
}
