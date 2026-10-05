"use client";

import { useActionState } from "react";

import { type FormState, saveChallenge, sendTestPush } from "./actions";

const idle: FormState = { status: "idle" };
const field = "w-full min-w-0 rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";

function Msg({ s }: { s: FormState }) {
  if (s.status === "idle") return null;
  return <span className={`text-xs ${s.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{s.message}</span>;
}

export function ChallengeForm({ c }: { c: { id: string; title: string; startsOn: string; days: number; cohortSize: number; active: boolean } }) {
  const [state, action, pending] = useActionState(saveChallenge, idle);
  return (
    <form action={action} className="rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
      <input type="hidden" name="id" value={c.id} />
      <div className="grid gap-2 sm:grid-cols-[1fr_10rem_6rem_6rem]">
        <label className="block text-xs font-semibold text-bh-ink/60">
          Заглавие
          <input name="title" defaultValue={c.title} required className={`${field} mt-1 font-normal`} />
        </label>
        <label className="block text-xs font-semibold text-bh-ink/60">
          Първи ден
          <input name="startsOn" type="date" defaultValue={c.startsOn} required className={`${field} mt-1 font-normal`} />
        </label>
        <label className="block text-xs font-semibold text-bh-ink/60">
          Дни
          <input name="days" type="number" min={7} max={90} defaultValue={c.days} className={`${field} mt-1 font-normal`} />
        </label>
        <label className="block text-xs font-semibold text-bh-ink/60">
          Група
          <input name="cohortSize" type="number" min={5} max={100} defaultValue={c.cohortSize} className={`${field} mt-1 font-normal`} />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-bh-ink/70">
          <input type="checkbox" name="active" defaultChecked={c.active} className="h-3.5 w-3.5 accent-[#146455]" />
          активно (приложението го показва и известията вървят)
        </label>
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper disabled:opacity-50">{pending ? "Записва…" : "Запиши"}</button>
        <Msg s={state} />
      </div>
    </form>
  );
}

export function TestPushForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, action, pending] = useActionState(sendTestPush, idle);
  return (
    <form action={action} className="rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr]">
        <input name="email" type="email" defaultValue={defaultEmail} placeholder="имейл с инсталирано приложение" className={field} />
        <input name="title" defaultValue="Ден 1 · 30 дни ритъм" placeholder="заглавие" className={field} />
        <input name="body" defaultValue="Стани в прозореца си и излез на светло за 10 минути." placeholder="текст" className={field} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full border border-bh-ink/25 px-4 py-2 text-xs font-semibold text-bh-ink disabled:opacity-50">{pending ? "Изпраща…" : "Прати тестово известие"}</button>
        <Msg s={state} />
      </div>
    </form>
  );
}
