"use client";

import { useEffect, useRef, useState } from "react";
import type { Exhibitor } from "@/lib/sponsors";

/**
 * The exhibitor wall: columns that drift at different rates as the section
 * crosses the viewport.
 *
 * Driven by scroll rather than by a timer. That distinction matters for
 * logos - a marquee moves while the visitor is trying to read it, and turns
 * every logo into a target that has to be chased to be clicked. Here the wall
 * is still whenever the page is still.
 *
 * Columns move together as blocks; individual cards never move relative to
 * their neighbours, which is what made the earlier speaker strip look unstable.
 */

/** Pixels of drift per unit of scroll progress. Alternating, deliberately small. */
const DRIFT = [-34, 20, -12, 26];

function columnsFor(width: number): number {
  if (width >= 1024) return 4;
  if (width >= 640) return 3;
  return 2;
}

function ExhibitorCard({ e }: { e: Exhibitor }) {
  const inner = (
    <>
      {e.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={e.logo}
          alt={e.name}
          loading="lazy"
          className="max-h-12 w-auto max-w-full object-contain"
        />
      ) : (
        <span className="text-center text-sm font-semibold leading-tight text-bh-ink/70">
          {e.name}
        </span>
      )}
      {e.category && (
        <span className="mt-3 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-bh-ink/40">
          {e.category}
        </span>
      )}
    </>
  );

  const shell =
    "bh-mint flex min-h-[7.5rem] flex-col items-center justify-center rounded-2xl p-5 transition-transform duration-300";

  return e.url ? (
    <a
      href={e.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      title={e.name}
      className={`${shell} hover:-translate-y-1`}
    >
      {inner}
    </a>
  ) : (
    <div className={shell}>{inner}</div>
  );
}

export function SponsorWall({ exhibitors }: { exhibitors: Exhibitor[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(4);

  // Column count follows the breakpoint. Kept in state rather than in CSS
  // because the items have to be dealt into real column elements for each one
  // to drift as a block.
  useEffect(() => {
    let raf = 0;
    const sync = () => {
      raf = 0;
      setCols(columnsFor(window.innerWidth));
    };
    const onResize = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Parallax. Writes transforms straight to the DOM - putting scroll position
  // into state would re-render the whole wall on every frame.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const columns = Array.from(
      el.querySelectorAll<HTMLElement>("[data-drift]"),
    );
    let raf = 0;

    const paint = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      // -1 as the wall enters from below, 0 centred, 1 as it leaves the top.
      const travel = window.innerHeight + r.height;
      const p = 1 - (2 * (r.top + r.height)) / travel;
      for (const c of columns) {
        c.style.transform = `translate3d(0, ${(p * Number(c.dataset.drift)).toFixed(2)}px, 0)`;
      }
    };

    // Coalesced to one paint per frame. No visibility gate: an off-screen wall
    // costs one rect read per frame, and gating it on an observer means a
    // dropped callback leaves the columns frozen wherever they happened to be.
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      for (const c of columns) c.style.transform = "";
    };
  }, [cols]);

  // Deal the exhibitors across the columns in reading order.
  const dealt: Exhibitor[][] = Array.from({ length: cols }, () => []);
  exhibitors.forEach((e, i) => dealt[i % cols].push(e));

  return (
    <div ref={wrap} className="flex gap-3 sm:gap-4">
      {dealt.map((column, i) => (
        <div
          key={i}
          data-drift={DRIFT[i % DRIFT.length]}
          className="flex flex-1 flex-col gap-3 will-change-transform sm:gap-4"
        >
          {column.map((e) => (
            <ExhibitorCard key={e.name} e={e} />
          ))}
        </div>
      ))}
    </div>
  );
}
