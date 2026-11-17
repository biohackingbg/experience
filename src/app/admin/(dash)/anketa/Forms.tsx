"use client";

import { useActionState } from "react";

import { type SendState, sendPartners, sendSpeakers, sendVisitors, testVisitors } from "./actions";

const input = "w-full rounded-xl border border-bh-ink/15 bg-white px-3 py-2 text-sm text-bh-ink";
const btn = "rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50";

function Note({ s }: { s: SendState }) {
  if (s.status === "idle") return null;
  return <p className={`mt-3 text-sm font-semibold ${s.status === "ok" ? "text-emerald-700" : "text-red-700"}`}>{s.message}</p>;
}

export function VisitorSend({ due, total, me }: { due: number; total: number; me: string }) {
  const [t, testAction, testing] = useActionState<SendState, FormData>(testVisitors, { status: "idle" });
  const [s, sendAction, sending] = useActionState<SendState, FormData>(sendVisitors, { status: "idle" });
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <form action={testAction} className="rounded-2xl bg-white p-4 ring-1 ring-bh-ink/8">
        <p className="text-sm font-semibold text-bh-ink">1. Тестово писмо</p>
        <p className="mt-1 text-xs text-bh-ink/55">С двама измислени придружители. Линковете работят, но отговорите не влизат в резултатите.</p>
        <input name="to" type="email" defaultValue={me} placeholder="твоят имейл" className={`mt-3 ${input}`} />
        <button disabled={testing} className={`mt-3 border border-bh-ink/25 text-bh-ink ${btn}`}>{testing ? "Праща…" : "Прати тест"}</button>
        <Note s={t} />
      </form>
      <form action={sendAction} className="rounded-2xl bg-white p-4 ring-1 ring-bh-ink/8">
        <p className="text-sm font-semibold text-bh-ink">2. Прати на посетителите</p>
        <p className="mt-1 text-xs text-bh-ink/55">
          {due} от {total} писма още не са пратени. Пратено писмо не тръгва втори път.
        </p>
        <label className="mt-3 flex items-start gap-2 text-sm text-bh-ink">
          <input type="checkbox" name="confirm" value="yes" className="mt-0.5 h-4 w-4 accent-[#146455]" />
          Потвърждавам: прати {due} писма сега.
        </label>
        <button disabled={sending || due === 0} className={`mt-3 bg-bh-ink text-bh-paper ${btn}`}>{sending ? "Праща…" : `Прати ${due} писма`}</button>
        <Note s={s} />
      </form>
    </div>
  );
}

export function ListSend({ kind, defaultLines, hint, me }: { kind: "partners" | "speakers"; defaultLines: string; hint: string; me: string }) {
  const [s, action, pending] = useActionState<SendState, FormData>(kind === "partners" ? sendPartners : sendSpeakers, { status: "idle" });
  return (
    <form action={action} className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-bh-ink/8">
      <p className="text-xs text-bh-ink/55">{hint}</p>
      <textarea name="lines" rows={8} defaultValue={defaultLines} spellCheck={false} className={`mt-2 font-mono text-xs ${input}`} />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input name="to" type="email" defaultValue={me} placeholder="имейл за теста" className={`max-w-xs ${input}`} />
        <button name="intent" value="test" disabled={pending} className={`border border-bh-ink/25 text-bh-ink ${btn}`}>Прати тест (първия ред)</button>
      </div>
      <label className="mt-4 flex items-start gap-2 text-sm text-bh-ink">
        <input type="checkbox" name="confirm" value="yes" className="mt-0.5 h-4 w-4 accent-[#146455]" />
        Потвърждавам: прати на всички редове с имейл. Всяко натискане праща отново.
      </label>
      <button name="intent" value="send" disabled={pending} className={`mt-3 bg-bh-ink text-bh-paper ${btn}`}>{pending ? "Праща…" : "Прати на всички"}</button>
      <Note s={s} />
    </form>
  );
}
