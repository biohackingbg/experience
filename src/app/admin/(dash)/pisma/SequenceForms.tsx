"use client";

import { useActionState } from "react";

import { type MailState, saveKind, sendKindNow, sendSequenceTestAction, skipLetter, toggleKind } from "./actions";

const initial: MailState = { status: "idle" };

const msg = (s: MailState) =>
  s.status !== "idle" && <p className={`mt-2 text-xs ${s.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{s.message}</p>;

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

/** On/off for one letter: a switch that saves itself the moment it is pressed. */
export function KindToggle({ kind, on }: { kind: string; on: boolean }) {
  const [state, action, pending] = useActionState(toggleKind, initial);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <button
        type="submit"
        disabled={pending}
        role="switch"
        aria-checked={on}
        aria-label={on ? "Изключи писмото" : "Включи писмото"}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${on ? "bg-bh-pine" : "bg-bh-ink/20"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[1.375rem]" : "left-0.5"}`} />
      </button>
      <span className={`text-xs font-semibold ${on ? "text-bh-pine" : "text-bh-ink/50"}`}>{pending ? "…" : on ? "включено" : "изключено"}</span>
      {state.status === "error" && <span className="text-xs text-red-600">{state.message}</span>}
    </form>
  );
}

/** The start day (or, for a list letter, the date) of one letter. */
export function KindForm({ kind, from, at, isList }: { kind: string; from: string | null; at: string | null; isList: boolean }) {
  const [state, action, pending] = useActionState(saveKind, initial);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="kind" value={kind} />
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
