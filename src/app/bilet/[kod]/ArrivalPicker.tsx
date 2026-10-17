"use client";

import { useActionState } from "react";

import { TICKET_PAGE, type Lang } from "@/lib/i18n";
import { DAY_LABEL } from "@/lib/tickets";

import { type ArrivalState, chooseArrivalSlot } from "./actions";

const initial: ArrivalState = { status: "idle" };

export type ArrivalDayView = {
  day: 1 | 2;
  chosen: string | null;
  slots: { id: string; label: string; free: number | null }[];
};

/**
 * The arrival window, one row of buttons per day the ticket is valid for.
 * The chosen one is filled; a full one is greyed and says so; the open-ended
 * last window never fills. One tap saves - there is nothing else to confirm.
 */
export function ArrivalPicker({ code, lang, days }: { code: string; lang: Lang; days: ArrivalDayView[] }) {
  const [state, action, pending] = useActionState(chooseArrivalSlot, initial);
  const t = TICKET_PAGE[lang];
  return (
    <section className="border-t border-bh-ink/8 px-7 py-5 print:hidden">
      <h2 className="text-sm font-medium text-bh-ink">{t.arrivalTitle}</h2>
      <p className="mt-1 text-xs leading-relaxed text-bh-ink/55">{t.arrivalHint}</p>
      {days.map((d) => (
        <form key={d.day} action={action} className="mt-4">
          <input type="hidden" name="code" value={code} />
          <input type="hidden" name="day" value={d.day} />
          <input type="hidden" name="lang" value={lang} />
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bh-ink/45">{DAY_LABEL[d.day][lang]}</span>
            {d.chosen && (
              <span className="text-xs font-semibold text-bh-pine">
                {t.arrivalChosen}: {d.slots.find((s) => s.id === d.chosen)?.label ?? d.chosen}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {d.slots.map((s) => {
              const on = s.id === d.chosen;
              const full = s.free !== null && s.free <= 0 && !on;
              return (
                <button
                  key={s.id}
                  type="submit"
                  name="slot"
                  value={s.id}
                  disabled={pending || full || on}
                  className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors disabled:cursor-default ${
                    on
                      ? "bg-bh-pine text-white"
                      : full
                        ? "border border-bh-ink/10 text-bh-ink/35"
                        : "border border-bh-ink/20 text-bh-ink hover:border-bh-ink"
                  }`}
                >
                  {s.label}
                  {!on && s.free !== null && (
                    <span className="ml-1.5 font-normal opacity-60">{full ? t.arrivalFull : `${s.free} ${t.arrivalFree}`}</span>
                  )}
                </button>
              );
            })}
          </div>
        </form>
      ))}
      {state.status === "error" && <p className="mt-2 text-xs text-red-600">{state.message}</p>}
    </section>
  );
}
