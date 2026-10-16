"use client";

import { useActionState } from "react";

import { type MailState, saveKind, sendKindNow, sendSequenceTestAction, skipLetter, toggleSequences } from "./actions";

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

const field = "rounded-full border border-bh-ink/15 bg-bh-paper px-3 py-1 text-xs text-bh-ink";

/** The switch, start day and (for a list letter) the date of one letter. */
export function KindForm({ kind, on, from, at, isList }: { kind: string; on: boolean; from: string | null; at: string | null; isList: boolean }) {
  const [state, action, pending] = useActionState(saveKind, initial);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="kind" value={kind} />
      <label className="flex items-center gap-1.5 text-xs text-bh-ink">
        <input type="checkbox" name="on" value="1" defaultChecked={on} className="h-3.5 w-3.5 accent-bh-pine" />
        активно
      </label>
      {isList ? (
        <label className="flex items-center gap-1.5 text-xs text-bh-ink/70">
          кога
          <input type="datetime-local" name="at" defaultValue={at ?? ""} className={field} />
        </label>
      ) : (
        <label className="flex items-center gap-1.5 text-xs text-bh-ink/70">
          от
          <input type="date" name="from" defaultValue={from ?? ""} className={field} />
        </label>
      )}
      <button type="submit" disabled={pending} className="rounded-full border border-bh-ink/25 px-3 py-1 text-xs font-semibold text-bh-ink disabled:opacity-50">
        {pending ? "…" : "Запази"}
      </button>
      {state.status !== "idle" && <span className={`text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{state.message}</span>}
    </form>
  );
}

export function SendNowForm({ kind, title, due }: { kind: string; title: string; due: number }) {
  const [state, action, pending] = useActionState(sendKindNow, initial);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Пращаш „${title}“ сега до ${due} ${due === 1 ? "човек" : "души"}? Ключовете и датите се прескачат; всеки го получава само веднъж.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      <button
        type="submit"
        disabled={pending || due === 0}
        className="rounded-full bg-bh-ink px-3 py-1 text-xs font-semibold text-bh-paper disabled:opacity-40"
      >
        {pending ? "Изпраща…" : `Прати сега (${due})`}
      </button>
      {msg(state)}
    </form>
  );
}
