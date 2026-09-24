"use client";

import { useEffect } from "react";

/**
 * Moves the wireframe mesh on the dark cards as the page scrolls.
 *
 * The mesh used to drift on a timer, which meant it moved while nobody was
 * looking and never answered to the page. Each card now publishes one
 * number - `--mesh-p`, -1 while the card is below the fold, 0 as it passes
 * the middle of the screen, 1 once it is above - and the CSS turns that into
 * a tilt and a shift (see .bh-mesh). The maths lives here, the look lives in
 * the stylesheet, so the effect can be retuned without touching this file.
 *
 * Mounted once for the whole page rather than per card: one scroll listener
 * and one observer serve every mesh there is, only the cards actually on
 * screen are written to, and all the reads happen in a single frame instead
 * of one layout pass per card.
 *
 * Nothing runs when the reader has asked for less motion, and with
 * JavaScript off the property keeps its CSS default and the mesh sits still.
 */
export function MeshParallax() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".bh-mesh"));
    if (cards.length === 0) return;

    const onScreen = new Set<HTMLElement>();
    let frame = 0;

    const update = () => {
      frame = 0;
      const half = window.innerHeight / 2;
      for (const card of onScreen) {
        const r = card.getBoundingClientRect();
        const span = half + r.height / 2;
        const p = span > 0 ? (half - (r.top + r.height / 2)) / span : 0;
        card.style.setProperty("--mesh-p", Math.max(-1, Math.min(1, p)).toFixed(4));
      }
    };

    const schedule = () => {
      if (!frame && onScreen.size > 0) frame = requestAnimationFrame(update);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const card = entry.target as HTMLElement;
          if (entry.isIntersecting) onScreen.add(card);
          else onScreen.delete(card);
        }
        update();
      },
      { threshold: 0 },
    );
    for (const card of cards) io.observe(card);

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
