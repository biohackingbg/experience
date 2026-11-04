"use client";

import { useActionState } from "react";

import { type MailState, sendAll, sendOfferAllAction, sendOfferTestAction, sendProgrammeAllAction, sendProgrammeTestAction, sendTest } from "./actions";

const initial: MailState = { status: "idle" };

const msg = (s: MailState) =>
  s.status !== "idle" && (
    <p className={`mt-2 text-xs ${s.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{s.message}</p>
  );

export function TestForm() {
  const [state, action, pending] = useActionState(sendTest, initial);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input
        type="email"
        name="to"
        required
        placeholder="твоят имейл"
        className="w-64 rounded-full border border-bh-ink/15 bg-bh-paper px-4 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35"
      />
      <button type="submit" disabled={pending} className="rounded-full border border-bh-ink/25 px-4 py-2 text-sm font-semibold text-bh-ink disabled:opacity-50">
        {pending ? "Изпраща…" : "Прати тест"}
      </button>
      <span className="basis-full">{msg(state)}</span>
    </form>
  );
}

export function SendAllForm({ pending: count }: { pending: number }) {
  const [state, action, pending] = useActionState(sendAll, initial);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Пращаш писмото до ${count} купувачи? Всеки го получава само веднъж.`)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        disabled={pending || count === 0}
        className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {pending ? "Изпраща…" : count === 0 ? "Всички са получили писмото" : `Прати до ${count} купувачи`}
      </button>
      {msg(state)}
    </form>
  );
}

export function OfferTestForm() {
  const [state, action, pending] = useActionState(sendOfferTestAction, initial);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input
        type="email"
        name="to"
        required
        defaultValue="ema.dimitrova@gmail.com"
        className="w-64 rounded-full border border-bh-ink/15 bg-bh-paper px-4 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35"
      />
      <button type="submit" disabled={pending} className="rounded-full border border-bh-ink/25 px-4 py-2 text-sm font-semibold text-bh-ink disabled:opacity-50">
        {pending ? "Изпраща…" : "Прати проба"}
      </button>
      <span className="basis-full">{msg(state)}</span>
    </form>
  );
}

export function OfferSendForm({ count }: { count: number }) {
  const [state, action, pending] = useActionState(sendOfferAllAction, initial);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Пращаш писмото с -40% до ${count} души? Всеки го получава само веднъж.`)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        disabled={pending || count === 0}
        className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {pending ? "Изпраща…" : count === 0 ? "Всички са получили писмото" : `Прати до ${count} души`}
      </button>
      {msg(state)}
    </form>
  );
}

export function ProgrammeTestForm() {
  const [state, action, pending] = useActionState(sendProgrammeTestAction, initial);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input
        type="email"
        name="to"
        required
        defaultValue="ema.dimitrova@gmail.com"
        className="w-64 rounded-full border border-bh-ink/15 bg-bh-paper px-4 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35"
      />
      <button type="submit" disabled={pending} className="rounded-full border border-bh-ink/25 px-4 py-2 text-sm font-semibold text-bh-ink disabled:opacity-50">
        {pending ? "Изпраща…" : "Прати проба"}
      </button>
      <span className="basis-full">{msg(state)}</span>
    </form>
  );
}

export function ProgrammeSendForm({ count }: { count: number }) {
  const [state, action, pending] = useActionState(sendProgrammeAllAction, initial);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Пращаш писмото с програмата до ${count} души с билет? Всеки го получава само веднъж.`)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        disabled={pending || count === 0}
        className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {pending ? "Изпраща…" : count === 0 ? "Всички са получили писмото" : `Прати до ${count} души`}
      </button>
      {msg(state)}
    </form>
  );
}
