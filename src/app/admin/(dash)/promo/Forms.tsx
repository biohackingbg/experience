"use client";

import { useActionState } from "react";

import { type FormState, addPromo } from "./actions";

const idle: FormState = { status: "idle" };
const field = "rounded-full border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";

export function PromoForm() {
  const [state, action, pending] = useActionState(addPromo, idle);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[10rem_9rem_7rem_7rem_9rem_1fr_auto]">
      <input name="code" required placeholder="КОД (напр. STUDENT)" className={`${field} uppercase`} autoCapitalize="characters" />
      <select name="kind" defaultValue="percent" className={field}>
        <option value="percent">процент</option>
        <option value="fixed">сума в €</option>
      </select>
      <input name="value" required inputMode="decimal" placeholder="стойност" className={field} />
      <input name="maxUses" inputMode="numeric" placeholder="макс. брой" className={field} />
      <input name="validUntil" type="date" className={field} title="валиден до" />
      <input name="note" placeholder="за кого е (студенти, партньор X…)" className={field} />
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-sm font-semibold text-bh-paper disabled:opacity-50">
          {pending ? "Записва…" : "Създай"}
        </button>
        {state.status !== "idle" && (
          <span className={`text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{state.message}</span>
        )}
      </div>
    </form>
  );
}
