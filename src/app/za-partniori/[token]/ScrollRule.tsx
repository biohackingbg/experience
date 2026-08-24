"use client";

import { useEffect, useRef, useState } from "react";

export type RuleItem = { h: string; p: string };

/**
 * A row of points on one continuous rule. The rule fills left to right as
 * the block scrolls up through a front at 60% of the viewport, and each
 * numbered marker wakes when the fill reaches it - dimming again on the
 * way back up. Same language as the journey timeline below, turned on
 * its side.
 *
 * Below `md` the columns stack, so the shared rule gives way to one hairline
 * per item; the markers keep their scroll behaviour.
 */
export function ScrollRule({ items }: { items: RuleItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [active, setActive] = useState(() => items.map(() => true));

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const n = items.length;

    const update = () => {
      raf = 0;
      const root = rootRef.current;
      const fill = fillRef.current;
      if (!root || !fill) return;
      const rect = root.getBoundingClientRect();
      const front = window.innerHeight * 0.6;
      // Fills over the block's own height: fully drawn by the time its
      // bottom edge reaches the front line.
      const p = Math.max(0, Math.min(1, (front - rect.top) / Math.max(1, rect.height)));
      fill.style.transform = `scaleX(${p})`;
      setActive((prev) => {
        const next = items.map((_, i) => p >= i / n + 0.04);
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
  }, [items, reduced]);

  return (
    <div ref={rootRef} className="relative mt-14">
      {/* the shared rule - track plus a fill scaled by scroll */}
      <div aria-hidden className="relative hidden h-px w-full bg-bh-ink/15 md:block">
        <div
          ref={fillRef}
          className="absolute -top-px left-0 h-[3px] w-full origin-left bg-bh-teal"
          style={{ transform: reduced ? "scaleX(1)" : "scaleX(0)", transition: "transform 0.25s linear" }}
        />
      </div>

      <div className="grid gap-10 md:grid-cols-3">
        {items.map((it, i) => {
          const on = reduced || active[i];
          return (
            <div key={it.h} className="relative border-t border-bh-ink/15 pt-10 md:border-0 md:pt-10">
              {/* numbered marker sitting on the rule */}
              <span
                aria-hidden
                className="absolute -top-[14px] left-0 grid h-7 w-7 place-items-center rounded-full font-mono text-[0.6rem] font-semibold tabular-nums ring-4 ring-white motion-safe:transition-all motion-safe:duration-500"
                style={{
                  background: on ? "#0bb4a0" : "#ffffff",
                  color: on ? "#ffffff" : "rgba(16,36,31,0.55)",
                  border: on ? "1px solid #0bb4a0" : "1px solid rgba(16,36,31,0.3)",
                  transform: on ? "scale(1.12)" : "none",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div
                className="motion-safe:transition-all motion-safe:duration-500"
                style={{ opacity: on ? 1 : 0.4, transform: on ? "none" : "translateY(8px)" }}
              >
                <h3 className="text-2xl font-semibold tracking-tight">{it.h}</h3>
                <p className="mt-3 text-sm font-light leading-relaxed text-bh-ink/65">{it.p}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
