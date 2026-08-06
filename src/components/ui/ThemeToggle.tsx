"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "bh-theme";

/** The <html data-theme> attribute is the source of truth — the pre-paint
 *  script sets it, so reading it avoids both a hydration mismatch and a
 *  duplicate copy of the theme in React state. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.dataset.theme === "dark";
const getServerSnapshot = () => false;

/* Both drawn on a 24 grid with a 2 stroke and round caps: at the 16px these
   render at, thinner strokes and shorter rays turned to specks. */
function Sun({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 1.5v2.2M12 20.3v2.2M22.5 12h-2.2M3.7 12H1.5M19.4 4.6l-1.6 1.6M6.2 17.8l-1.6 1.6M19.4 19.4l-1.6-1.6M6.2 6.2L4.6 4.6" />
    </svg>
  );
}

function Moon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
    </svg>
  );
}

export function ThemeToggle() {
  const on = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Private mode — the choice just won't persist.
    }
  }

  return (
    <div className="flex items-center gap-2 text-bh-ink/55">
      <Sun className="h-4 w-4" />
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Тъмна тема"
        onClick={toggle}
        className="relative h-6 w-11 shrink-0 rounded-full border border-bh-ink/20 bg-bh-ink/8 transition-colors hover:border-bh-ink/40"
      >
        <span
          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-bh-ink transition-[left] duration-300 ease-out ${
            on ? "left-[1.55rem]" : "left-[0.2rem]"
          }`}
        />
      </button>
      <Moon className="h-4 w-4" />
    </div>
  );
}
