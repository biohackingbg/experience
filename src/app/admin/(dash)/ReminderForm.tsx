"use client";

import { useActionState } from "react";

import { type ActionState, remindOrder } from "./actions";

const initial: ActionState = { status: "idle" };

/** The one "you did not finish" email, sent by hand, once. */
export function ReminderForm({ reference, canRemind, note }: { reference: string; canRemind: boolean; note: string | null }) {
  const [state, action, pending] = useActionState(remindOrder, initial);

  if (!canRemind) {
    return <span className="text-xs text-bh-ink/50">{state.status === "ok" ? state.message : note}</span>;
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="reference" value={reference} />
      <button
        type="submit"
        disabled={pending || state.status === "ok"}
        className="rounded-full bg-bh-ink px-3 py-1.5 text-xs font-semibold text-bh-paper disabled:opacity-50"
      >
        {pending ? "Изпраща…" : state.status === "ok" ? "Изпратено" : "Напомни"}
      </button>
      {state.status !== "idle" && (
        <span className={`text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>
          {state.message}
        </span>
      )}
    </form>
  );
}
