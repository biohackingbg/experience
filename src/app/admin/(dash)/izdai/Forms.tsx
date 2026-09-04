"use client";

import { useActionState, useState } from "react";

import type { BankDetails } from "@/lib/manual-orders";
import { TIERS, formatPrice } from "@/lib/tickets";

import { type IssueState, issueOrder, saveBank } from "./actions";

const idle: IssueState = { status: "idle" };
const field = "w-full min-w-0 rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";

export type Prefill = { kind?: "free" | "bank"; name?: string; email?: string; quantity?: number; note?: string; tierId?: string };

export function IssueForm({ prefill, prices }: { prefill: Prefill; prices: Record<string, number> }) {
  const [state, action, pending] = useActionState(issueOrder, idle);
  const [kind, setKind] = useState<"free" | "bank">(prefill.kind ?? "free");
  const [tierId, setTierId] = useState(prefill.tierId ?? "plus");
  const [qty, setQty] = useState(prefill.quantity ?? 1);
  const total = (prices[tierId] ?? 0) * qty;

  return (
    <form action={action} key={`${prefill.name}-${prefill.email}`}>
      <div className="flex flex-wrap gap-2">
        {(["free", "bank"] as const).map((k) => (
          <label key={k} className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ring-1 ${kind === k ? "bg-bh-ink text-bh-paper ring-bh-ink" : "text-bh-ink ring-bh-ink/20"}`}>
            <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
            {k === "free" ? "Безплатни билети (партньор, лектор)" : "По банков път (фирма, проформа)"}
          </label>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <input name="name" defaultValue={prefill.name ?? ""} required placeholder="име и фамилия на получателя" className={field} />
        <input name="email" type="email" defaultValue={prefill.email ?? ""} required placeholder="имейл - там отиват билетите" className={field} />
        <input name="phone" placeholder="телефон (по избор)" className={field} />
        <input name="note" defaultValue={prefill.note ?? ""} placeholder="бележка за нас: партньор, договор…" className={field} />
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_8rem_10rem_8rem]">
        <select name="tierId" value={tierId} onChange={(e) => setTierId(e.target.value)} className={field}>
          {TIERS.map((t) => <option key={t.id} value={t.id}>{t.name} · {formatPrice(prices[t.id] ?? 0)} €</option>)}
        </select>
        <input name="quantity" type="number" min={1} max={200} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} className={field} title="брой билети" />
        <select name="lang" defaultValue="bg" className={field}>
          <option value="bg">писмо на български</option>
          <option value="en">писмо на английски</option>
        </select>
        {kind === "bank" ? (
          <input name="dueDays" type="number" min={1} max={60} defaultValue={7} className={field} title="дни за превод" />
        ) : (
          <span />
        )}
      </div>

      {kind === "bank" && (
        <div className="mt-2 grid gap-2 rounded-2xl bg-bh-cloud p-3 ring-1 ring-bh-ink/8 sm:grid-cols-3">
          <input name="company" placeholder="фирма" className={field} />
          <input name="vatNumber" placeholder="ЕИК / ДДС номер" className={field} />
          <input name="address" placeholder="адрес" className={field} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper disabled:opacity-50">
          {pending ? "Издава…" : kind === "free" ? `Издай ${qty} ${qty === 1 ? "билет" : "билета"} безплатно` : `Прати проформа за ${formatPrice(total)} €`}
        </button>
        {kind === "bank" && <span className="text-xs text-bh-ink/55">местата се запазват до срока; при получен превод натискаш „Платена“ по-долу</span>}
      </div>
      {state.status !== "idle" && (
        <p className={`mt-3 text-sm ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{state.message}</p>
      )}
    </form>
  );
}

export function BankForm({ bank }: { bank: BankDetails }) {
  const [state, action, pending] = useActionState(saveBank, idle);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-[1fr_1fr_8rem_1fr_auto]">
      <input name="holder" defaultValue={bank.holder} placeholder="получател (фирма)" className={field} />
      <input name="iban" defaultValue={bank.iban} placeholder="IBAN" className={`${field} font-mono`} />
      <input name="bic" defaultValue={bank.bic} placeholder="BIC" className={`${field} font-mono`} />
      <input name="bank" defaultValue={bank.bank} placeholder="банка" className={field} />
      <div className="flex items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-full border border-bh-ink/25 px-4 py-2 text-sm font-semibold text-bh-ink disabled:opacity-50">Запиши</button>
        {state.status !== "idle" && <span className={`text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
