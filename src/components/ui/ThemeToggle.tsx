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

function Sun({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.6v2.2M12 19.2v2.2M21.4 12h-2.2M4.8 12H2.6M18.6 5.4l-1.6 1.6M7 17l-1.6 1.6M18.6 18.6L17 17M7 7L5.4 5.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Moon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M20 14.2A8.2 8.2 0 019.8 4a8.2 8.2 0 100 16 8.2 8.2 0 0010.2-5.8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
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
