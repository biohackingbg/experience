"use client";

import { useActionState } from "react";

import { TICKET_PAGE, type Lang } from "@/lib/i18n";
import { DAY_LABEL } from "@/lib/tickets";

import { type DayState, chooseTicketDay } from "./actions";

const initial: DayState = { status: "idle" };

/**
 * The day of a one-day ticket: two buttons, the current one filled. One tap
 * saves; the page re-renders with the new day on the card above.
 */
export function DayPicker({ code, lang, current }: { code: string; lang: Lang; current: number | null }) {
  const [state, action, pending] = useActionState(chooseTicketDay, initial);
  const t = TICKET_PAGE[lang];
  return (
    <form id="den" action={action} className="scroll-mt-6 border-t border-bh-ink/8 px-7 py-5 print:hidden">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="lang" value={lang} />
      <h2 className="text-sm font-medium text-bh-ink">{current ? t.dayTitle : t.dayAskNone}</h2>
      <p className="mt-1 text-xs leading-relaxed text-bh-ink/55">{t.dayHint}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {([1, 2] as const).map((d) => {
          const on = d === current;
          return (
            <button
              key={d}
              type="submit"
              name="day"
              value={d}
              disabled={pending || on}
              className={`rounded-2xl px-3 py-3 text-sm font-semibold transition-colors disabled:cursor-default ${
                on ? "bg-bh-pine text-white" : "border border-bh-ink/20 text-bh-ink hover:border-bh-ink"
              }`}
            >
              {DAY_LABEL[d][lang]}
              <span className="mt-0.5 block text-[0.65rem] font-normal opacity-70">{on ? t.dayCurrent : t.dayPick}</span>
            </button>
          );
        })}
      </div>
      {state.status === "error" && <p className="mt-2 text-xs text-red-600">{state.message}</p>}
      {state.status === "ok" && state.message && <p className="mt-2 text-xs text-bh-pine">{state.message}</p>}
    </form>
  );
}
