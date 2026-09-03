"use client";

import { useActionState } from "react";

import { CATEGORIES, EXPENSE_STATUS } from "@/lib/finance-options";
import { createExpense, saveBudget, type FormState } from "./actions";

const idle: FormState = { status: "idle" };
const field =
  "rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";

/** One row of the ledger, typed in. Net of VAT - it says so where the number goes. */
export function ExpenseForm() {
  const [state, action, pending] = useActionState(createExpense, idle);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[8.5rem_1fr_1fr_7rem] lg:grid-cols-[8.5rem_10rem_1fr_1fr_7rem_8rem_8rem]">
      <input type="date" name="date" defaultValue={today} className={field} />
      <select name="category" required className={field} defaultValue="">
        <option value="" disabled>категория</option>
        {CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>{c.label}</option>
        ))}
      </select>
      <input name="supplier" required maxLength={120} placeholder="доставчик" className={field} />
      <input name="description" maxLength={300} placeholder="за какво" className={field} />
      <input name="amount" inputMode="decimal" required placeholder="€ без ДДС" className={field} />
      <select name="status" defaultValue="planned" className={field}>
        {EXPENSE_STATUS.filter((s) => s.id !== "cancelled").map((s) => (
          <option key={s.id} value={s.id}>{s.label}</option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-bh-ink px-4 py-2 text-sm font-semibold text-bh-paper disabled:opacity-50"
        >
          {pending ? "Записва…" : "Добави"}
        </button>
        {state.status !== "idle" && (
          <span className={`text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{state.message}</span>
        )}
      </div>
    </form>
  );
}

/**
 * The budget for one category - what "over" is measured against.
 *
 * Drawn as a field that looks editable rather than a number with a link
 * beside it: the previous version saved fine, but nothing on the row said
 * so, and a control nobody sees is a control that does not exist. Emptying
 * it removes the budget.
 */
export function BudgetForm({ category, amountCents }: { category: string; amountCents: number | null }) {
  const [state, action, pending] = useActionState(saveBudget, idle);
  return (
    <form action={action} className="flex items-center justify-end gap-2">
      <input type="hidden" name="category" value={category} />
      <div className="relative">
        <input
          name="amount"
          inputMode="decimal"
          defaultValue={amountCents === null ? "" : String(amountCents / 100)}
          placeholder="няма"
          aria-label="Бюджет в евро без ДДС"
          className="w-28 rounded-lg border border-bh-ink/20 bg-bh-paper py-1.5 pl-2.5 pr-6 text-right text-sm text-bh-ink placeholder:text-bh-ink/30 focus:border-bh-ink focus:outline-none"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-bh-ink/40">€</span>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-bh-ink/20 px-2.5 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink hover:bg-bh-cloud disabled:opacity-50"
      >
        {pending ? "…" : "Запиши"}
      </button>
      {state.status !== "idle" && (
        <span className={`w-14 text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>
          {state.message}
        </span>
      )}
    </form>
  );
}
