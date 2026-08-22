"use client";

import { useEffect, useRef, useState } from "react";

export type JourneyStep = {
  t: string;
  h: string;
  p: string;
  brand: boolean;
};

/**
 * The visitor-journey timeline, driven by scroll position rather than a
 * one-shot reveal: the teal line fills to a "front" at 55% of the viewport,
 * steps wake as the front passes their dot and dim again when it retreats —
 * so scrolling back up plays the day in reverse.
 *
 * Under prefers-reduced-motion everything renders in its final, fully
 * readable state and nothing moves.
 */
export function JourneyTimeline({ steps }: { steps: JourneyStep[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  // Read once, lazily: the OS preference does not change mid-visit in any
  // way worth reacting to, and reading it in the initializer keeps the
  // effect from setting state synchronously.
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [active, setActive] = useState(() => steps.map(() => true));

  useEffect(() => {
    if (reduced) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const list = listRef.current;
      const line = lineRef.current;
      if (!list || !line) return;

      const rect = list.getBoundingClientRect();
      const front = window.innerHeight * 0.55;
      const filled = Math.max(0, Math.min(rect.height, front - rect.top));

      // Height via transform so the browser only composites, never relayouts.
      line.style.transform = `scaleY(${rect.height ? filled / rect.height : 0})`;

      const items = (Array.from(list.children) as HTMLElement[]).filter((el) => el.tagName === "LI");
      setActive((prev) => {
        const next = items.map((el) => el.getBoundingClientRect().top - rect.top + 14 <= filled);
        return next.some((v, i) => v !== prev[i]) ? next : prev;
      });
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [steps, reduced]);

  return (
    <ol ref={listRef} className="relative ml-2 border-l border-bh-ink/15 sm:ml-24">
      {/* the fill: a full-height line scaled from the top by scroll progress */}
      <div
        ref={lineRef}
        aria-hidden
        className="absolute -left-px top-0 h-full w-[2px] origin-top bg-bh-teal"
        style={{ transform: "scaleY(0)", transition: "transform 0.25s linear" }}
      />
      {steps.map((j, i) => {
        const on = reduced || active[i];
        return (
          <li
            key={j.t}
            className="relative pb-8 pl-8 last:pb-0 sm:pl-10 motion-safe:transition-all motion-safe:duration-500"
            style={{ opacity: on ? 1 : 0.35, transform: on ? "none" : "translateY(10px)" }}
          >
            {/* teal dot = the visitor is standing at a brand */}
            <span
              aria-hidden
              className="absolute -left-[7px] top-1.5 h-3.5 w-3.5 rounded-full ring-4 ring-white motion-safe:transition-all motion-safe:duration-500"
              style={{
                background: on ? (j.brand ? "#0bb4a0" : "#10241f") : "#ffffff",
                border: on ? "none" : "1px solid rgba(16,36,31,0.3)",
                transform: on ? "scale(1.25)" : "none",
              }}
            />
            <span className="font-mono text-[0.72rem] tabular-nums tracking-[0.15em] text-bh-ink/70 sm:absolute sm:-left-24 sm:top-0.5">
              {j.t}
            </span>
            <div className="mt-1 sm:mt-0">
              <span className="text-lg font-semibold tracking-tight">{j.h}</span>
              {j.brand && (
                <span
                  className="ml-3 inline-block rounded-full bg-bh-pine/12 px-2.5 py-0.5 align-middle font-mono text-[0.58rem] uppercase tracking-[0.15em] text-bh-pine motion-safe:transition-opacity motion-safe:duration-500"
                  style={{ opacity: on ? 1 : 0 }}
                >
                  Контакт с бранда
                </span>
              )}
              <p className="mt-1 text-sm font-light leading-relaxed text-bh-ink/65">{j.p}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
