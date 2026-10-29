"use client";

import { useActionState } from "react";

import { type ResendState, sendTicketsToPeople } from "./actions";

const initial: ResendState = { status: "idle" };

/**
 * Sends each ticket of an order to a different person. One line per person:
 * "email" or "email, Име Фамилия"; the first line gets the first ticket, and so on.
 */
export function PeopleForm({ reference }: { reference: string }) {
  const [state, action, pending] = useActionState(sendTicketsToPeople, initial);
  return (
    <details className="w-full">
      <summary className="cursor-pointer text-xs font-semibold text-bh-ink/60">Прати по един билет на всеки</summary>
      <form action={action} className="mt-2 flex flex-col gap-2">
        <input type="hidden" name="reference" value={reference} />
        <textarea
          name="people"
          rows={3}
          placeholder={"имейл, Име Фамилия\nдруг@имейл.bg, Друго Име"}
          className="w-full max-w-md rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-xs text-bh-ink placeholder:text-bh-ink/35"
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-bh-ink px-3 py-1.5 text-xs font-semibold text-bh-paper disabled:opacity-50"
          >
            {pending ? "Изпраща…" : "Изпрати"}
          </button>
          {state.status !== "idle" && (
            <span className={`text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{state.message}</span>
          )}
        </div>
        <p className="text-[0.65rem] text-bh-ink/45">Ред по ред: първият получава първия билет, вторият втория. Името след запетаята става име на билета.</p>
      </form>
    </details>
  );
}
