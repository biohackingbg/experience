"use client";

import { useActionState, useState } from "react";

import { CATEGORIES, EXPENSE_STATUS, categoryLabel } from "@/lib/finance-options";
import { changeExpenseStatus, createExpense, editExpense, saveBudget, type FormState } from "./actions";

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

const STATUS_TONE: Record<string, string> = {
  planned: "bg-bh-ink/10 text-bh-ink/60",
  invoiced: "bg-[#d0a11a]/20 text-[#7a5b00]",
  paid: "bg-[#0E8C7D]/15 text-[#0b6d61]",
  cancelled: "bg-bh-ink/5 text-bh-ink/35 line-through",
};

const bgDate = (d: Date) =>
  new Intl.DateTimeFormat("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Sofia" }).format(d);

/** The date as the <input type="date"> wants it, in Sofia's day, not UTC's. */
const isoDay = (d: Date) => {
  const local = new Date(d.getTime() + 3 * 3600_000);
  return local.toISOString().slice(0, 10);
};

export type LedgerRow = {
  id: string;
  date: Date;
  category: string;
  supplier: string;
  description: string | null;
  amountCents: number;
  status: string;
  invoiceNo: string | null;
};

/**
 * A ledger row that can be corrected in place.
 *
 * Status alone used to be editable, so a mistyped amount meant cancelling the
 * row and entering it again - two lines where the ledger should show one.
 * At rest the row reads; "промени" turns the same row into its own form.
 */
export function ExpenseRow({ e }: { e: LedgerRow }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (prev: FormState, data: FormData) => {
      const next = await editExpense(prev, data);
      if (next.status === "ok") setOpen(false);
      return next;
    },
    idle,
  );

  if (open) {
    return (
      <tr className="border-b border-bh-ink/8 bg-bh-paper last:border-0">
        <td colSpan={6} className="px-5 py-4">
          <form action={action} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={e.id} />
            <input type="date" name="date" defaultValue={isoDay(e.date)} className={field} />
            <select name="category" defaultValue={e.category} className={field}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            <input name="supplier" defaultValue={e.supplier} required maxLength={120} placeholder="доставчик" className={`${field} w-44`} />
            <input name="description" defaultValue={e.description ?? ""} maxLength={300} placeholder="за какво" className={`${field} w-52`} />
            <input name="invoiceNo" defaultValue={e.invoiceNo ?? ""} maxLength={40} placeholder="фактура" className={`${field} w-28`} />
            <input name="amount" inputMode="decimal" defaultValue={String(e.amountCents / 100)} required placeholder="€ без ДДС" className={`${field} w-28 text-right`} />
            <select name="status" defaultValue={e.status} className={field}>
              {EXPENSE_STATUS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-sm font-semibold text-bh-paper disabled:opacity-50">
              {pending ? "Записва…" : "Запиши"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-bh-ink/20 px-4 py-2 text-sm font-semibold text-bh-ink/70">
              Откажи
            </button>
            {state.status === "error" && <span className="text-xs text-red-600">{state.message}</span>}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`border-b border-bh-ink/8 last:border-0 ${e.status === "cancelled" ? "text-bh-ink/40" : ""}`}>
      <td className="px-5 py-3 font-mono text-xs">{bgDate(e.date)}</td>
      <td className="px-5 py-3">{categoryLabel(e.category)}</td>
      <td className="px-5 py-3">
        <div className="font-medium text-bh-ink">{e.supplier}</div>
        {e.description && <div className="text-xs text-bh-ink/55">{e.description}</div>}
      </td>
      <td className="px-5 py-3 font-mono text-xs text-bh-ink/70">{e.invoiceNo ?? "-"}</td>
      <td className="px-5 py-3">
        {/* Status on its own, because it is the change made most often; the
            rest of the row is behind "промени". Nothing is deleted - the way
            out is the "отменен" status. */}
        <form action={changeExpenseStatus} className="flex items-center gap-2">
          <input type="hidden" name="id" value={e.id} />
          <select
            name="status"
            defaultValue={e.status}
            className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${STATUS_TONE[e.status] ?? STATUS_TONE.planned}`}
          >
            {EXPENSE_STATUS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <button type="submit" className="text-xs text-bh-ink/50 hover:text-bh-ink">запиши</button>
        </form>
      </td>
      <td className="px-5 py-3 text-right">
        <div className="flex items-center justify-end gap-3">
          <span className="font-semibold text-bh-ink">
            {(e.amountCents / 100).toLocaleString("bg-BG", { minimumFractionDigits: e.amountCents % 100 ? 2 : 0 })} €
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-bh-ink/20 px-2.5 py-1 text-xs font-semibold text-bh-ink/70 transition-colors hover:border-bh-ink hover:text-bh-ink"
          >
            промени
          </button>
        </div>
      </td>
    </tr>
  );
}
