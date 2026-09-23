"use client";

import { useActionState } from "react";

import { type TextState, saveTexts } from "./actions";

const idle: TextState = { status: "idle" };
const field =
  "w-full rounded-2xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm leading-relaxed text-bh-ink placeholder:text-bh-ink/35";

export type SlotField = {
  id: string;
  label: string;
  hint: string;
  vars: string[];
  multiline: boolean;
  value: string;
  /** True while the wording is still the one in the code. */
  isDefault: boolean;
};

/**
 * The words of one letter, editable.
 *
 * Only prose: the layout, the buttons, the ticket rows and the bank table
 * stay in code, because a letter that loses its button is a letter nobody
 * can act on. Saving re-renders the preview above, so the change is read
 * in place rather than guessed at.
 */
export function TextForm({ letter, slots }: { letter: string; slots: SlotField[] }) {
  const [state, action, pending] = useActionState(saveTexts, idle);

  return (
    <form action={action} className="mt-4 rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
      <input type="hidden" name="letter" value={letter} />
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bh-ink/50">Текстовете в това писмо</div>
      <div className="mt-3 flex flex-col gap-4">
        {slots.map((slot) => (
          <label key={slot.id} className="block">
            <span className="flex flex-wrap items-baseline gap-2">
              <span className="text-xs font-semibold text-bh-ink">{slot.label}</span>
              {!slot.isDefault && (
                <span className="rounded-full bg-[#d0a11a]/20 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wide text-[#7a5b00]">
                  променен
                </span>
              )}
              <span className="text-[0.68rem] text-bh-ink/55">{slot.hint}</span>
            </span>
            {slot.vars.length > 0 && (
              /* Named, not numbered: someone editing a sentence has to see
                 what the letter will put where, without a legend. */
              <span className="mt-1 block text-[0.68rem] text-bh-ink/55">
                Може да ползваш:{" "}
                {slot.vars.map((v) => (
                  <code key={v} className="mr-1 rounded bg-bh-ink/8 px-1 py-0.5 font-mono text-[0.66rem] text-bh-ink/80">{`{${v}}`}</code>
                ))}
              </span>
            )}
            {slot.multiline ? (
              <textarea name={slot.id} defaultValue={slot.value} rows={3} className={`${field} mt-1.5`} />
            ) : (
              <input name={slot.id} defaultValue={slot.value} className={`${field} mt-1.5`} />
            )}
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper disabled:opacity-50"
        >
          {pending ? "Записва…" : "Запиши текстовете"}
        </button>
        <button
          type="submit"
          name="reset"
          value="1"
          disabled={pending}
          className="rounded-full px-3 py-2 text-xs font-semibold text-bh-ink/55 transition-colors hover:text-bh-ink disabled:opacity-50"
        >
          Върни текстовете по подразбиране
        </button>
        {state.status !== "idle" && (
          <span className={`text-xs ${state.status === "ok" ? "text-[#0b6d61]" : "font-semibold text-red-600"}`}>
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
