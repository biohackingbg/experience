import "server-only";

import { cache } from "react";

import type { Lang } from "@/lib/i18n";
import { getSetting, setSetting } from "@/lib/settings";

/**
 * The strip above the site: one sentence the organiser controls, in both
 * languages, on or off. Used for the thing a visitor should know before
 * they read anything else - "prices go up on 15 October", "the Saturday
 * workshops are full".
 *
 * Deliberately not dismissible and deliberately empty by default: a bar
 * that is always there stops being read.
 */
export type Notice = {
  on: boolean;
  bg: string;
  en: string;
  /** ISO time after which the bar switches itself off ("69 € до днес" must not outlive today). */
  until?: string;
};

const EMPTY: Notice = { on: false, bg: "", en: "" };

export function parseNotice(value: string | null): Notice {
  if (!value) return EMPTY;
  try {
    const v = JSON.parse(value) as Partial<Notice>;
    const bg = typeof v.bg === "string" ? v.bg.trim().slice(0, 200) : "";
    const en = typeof v.en === "string" ? v.en.trim().slice(0, 200) : "";
    const until = typeof v.until === "string" && !Number.isNaN(Date.parse(v.until)) ? v.until : undefined;
    const expired = until !== undefined && Date.now() >= Date.parse(until);
    // On means on *and* something to say - an empty bar renders nothing -
    // and not past its own end time.
    return { on: v.on === true && bg.length > 0 && !expired, bg, en, until };
  } catch {
    return EMPTY;
  }
}

/**
 * Cached per render: the bar is asked for by both language layouts and must
 * not cost two queries. A database failure means no bar, never a broken page.
 */
export const getNotice = cache(async (): Promise<Notice> => {
  try {
    return parseNotice((await getSetting("site_notice"))?.value ?? null);
  } catch {
    return EMPTY;
  }
});

export async function saveNotice(n: Notice): Promise<void> {
  // Saved from the dashboard: a new text starts without an end time.
  await setSetting("site_notice", JSON.stringify({ on: n.on, bg: n.bg.slice(0, 200), en: n.en.slice(0, 200) }));
}

/** The text for a language, falling back to Bulgarian when only it is filled. */
export const noticeText = (n: Notice, lang: Lang): string => (lang === "en" ? n.en || n.bg : n.bg);
