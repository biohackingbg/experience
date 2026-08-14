"use client";

import { useEffect, useRef } from "react";

/**
 * The accent thread on the very top edge of the screen: fills left to right
 * as the page scrolls, pulls back as it returns — the loader-style line from
 * the reference. Lives inside the sticky nav, whose top edge is the viewport's
 * top edge while stuck.
 *
 * Driven by scroll position, not by an animation — the bar is a mirror of
 * where you are, the same information the scrollbar carries, so it stays
 * honest under prefers-reduced-motion too. Written straight to the DOM
 * because putting scroll position into state would re-render on every frame.
 */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const paint = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
    };
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
    };
  }, []);

  return (
    <div
      ref={bar}
      aria-hidden
      className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-bh-teal"
    />
  );
}
