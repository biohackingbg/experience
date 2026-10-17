"use client";

import { useActionState } from "react";

import { type PlanState, assignRemainingAction, saveArrivalPlanAction } from "./actions";

const initial: PlanState = { status: "idle" };
const msg = (s: PlanState) =>
  s.status !== "idle" && <p className={`mt-2 text-xs ${s.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{s.message}</p>;

export function ArrivalPlanForm({ on, slots, capacity }: { on: boolean; slots: string[]; capacity: number }) {
  const [state, action, pending] = useActionState(saveArrivalPlanAction, initial);
  return (
    <form action={action} className="mt-4 flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm text-bh-ink">
        <input type="checkbox" name="on" value="1" defaultChecked={on} className="h-4 w-4 accent-bh-pine" />
        Пуснато: показва избора на час на билетите, в приложението и в писмото преди събитието
      </label>
      <label className="text-xs text-bh-ink/60">
        Прозорци (начало на всеки, последният с „+“ е без лимит)
        <input
          name="slots"
          defaultValue={slots.join(", ")}
          className="mt-1 w-full rounded-full border border-bh-ink/15 bg-bh-paper px-4 py-2 font-mono text-sm text-bh-ink"
        />
      </label>
      <label className="text-xs text-bh-ink/60">
        Места на прозорец, на ден
        <input
          type="number"
          name="capacity"
          min={1}
          max={2000}
          defaultValue={capacity}
          className="mt-1 w-32 rounded-full border border-bh-ink/15 bg-bh-paper px-4 py-2 text-sm text-bh-ink"
        />
      </label>
      <div>
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-sm font-semibold text-bh-paper disabled:opacity-50">
          {pending ? "Записва…" : "Запази плана"}
        </button>
        {msg(state)}
      </div>
    </form>
  );
}

export function AssignRemainingForm({ unchosen }: { unchosen: number }) {
  const [state, action, pending] = useActionState(assignRemainingAction, initial);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`Даваш час на ${unchosen} билета без избран час? Най-ранните купувачи получават най-ранните свободни прозорци.`)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        disabled={pending || unchosen === 0}
        className="rounded-full border border-bh-ink/25 px-4 py-2 text-sm font-semibold text-bh-ink disabled:opacity-40"
      >
        {pending ? "Разпределя…" : `Разпредели останалите (${unchosen})`}
      </button>
      {msg(state)}
    </form>
  );
}
