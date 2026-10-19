"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * A headline figure that is as large as its container allows.
 *
 * It measures how wide the text is at a reference size and scales that to
 * the container's width, never past `max` (so a lone "1" does not fill a
 * tile). Re-measured when the container is resized and once the web font
 * has loaded, because the font changes the text's width. Until the first
 * measurement the CSS fallback size applies, so nothing jumps on a server
 * render; the figure never wraps and never runs past the edge.
 */
export function FitNumber({
  children,
  max = 72,
  min = 20,
  className = "",
}: {
  children: React.ReactNode;
  /** Largest font size, in px. */
  max?: number;
  /** Smallest font size, in px - below this the figure is left to clip rather than become unreadable. */
  min?: number;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = box.current;
    const t = text.current;
    if (!el || !t) return;
    const REF = 100;
    const fit = () => {
      t.style.fontSize = `${REF}px`;
      const w = t.getBoundingClientRect().width;
      const avail = el.clientWidth;
      if (!w || !avail) return;
      // A hair of slack, so rounding never tips the last glyph over the edge.
      // Set on the element itself: the size is not React state, and React
      // leaves a style it did not change alone.
      t.style.fontSize = `${Math.max(min, Math.min(max, Math.floor((avail / w) * REF * 0.98)))}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [children, max, min]);

  return (
    <div ref={box} className={`w-full overflow-hidden ${className}`}>
      <span
        ref={text}
        className="inline-block whitespace-nowrap font-black leading-none tracking-tight"
        style={{ fontSize: `clamp(1.5rem, 11cqw, ${max}px)` }}
      >
        {children}
      </span>
    </div>
  );
}
