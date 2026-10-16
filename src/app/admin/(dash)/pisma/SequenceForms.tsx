"use client";

import { useActionState } from "react";

import { type MailState, sendSequenceTestAction, skipLetter, toggleSequences } from "./actions";

const initial: MailState = { status: "idle" };

const msg = (s: MailState) =>
  s.status !== "idle" && <p className={`mt-2 text-xs ${s.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{s.message}</p>;

export function ToggleForm({ on }: { on: boolean }) {
  const [state, action, pending] = useActionState(toggleSequences, initial);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!on && !window.confirm("Пускаш автоматичните писма? Първият пуск праща „CORE → PLUS · ден 5“ на всички, които вече имат CORE от над 5 дни.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <button
        type="submit"
        disabled={pending}
        className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-50 ${
          on ? "border border-bh-ink/25 text-bh-ink" : "bg-bh-ink text-bh-paper"
        }`}
      >
        {pending ? "…" : on ? "Спри поредиците" : "Пусни поредиците"}
      </button>
      {msg(state)}
    </form>
  );
}

export function SequenceTestForm({ kind }: { kind: string }) {
  const [state, action, pending] = useActionState(sendSequenceTestAction, initial);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="kind" value={kind} />
      <input
        type="email"
        name="to"
        required
        placeholder="твоят имейл"
        className="w-56 rounded-full border border-bh-ink/15 bg-bh-paper px-4 py-1.5 text-xs text-bh-ink placeholder:text-bh-ink/35"
      />
      <button type="submit" disabled={pending} className="rounded-full border border-bh-ink/25 px-3 py-1.5 text-xs font-semibold text-bh-ink disabled:opacity-50">
        {pending ? "Изпраща…" : "Прати проба"}
      </button>
      <span className="basis-full">{msg(state)}</span>
    </form>
  );
}

export function SkipForm({ id, skipped }: { id: string; skipped: boolean }) {
  const [state, action, pending] = useActionState(skipLetter, initial);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="undo" value={skipped ? "1" : "0"} />
      <button type="submit" disabled={pending} className="text-xs font-semibold text-bh-ink/60 underline underline-offset-2 hover:text-bh-ink disabled:opacity-50">
        {skipped ? "Върни в плана" : "Не го пращай"}
      </button>
      {msg(state)}
    </form>
  );
}
