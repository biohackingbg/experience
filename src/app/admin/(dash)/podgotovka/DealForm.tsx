"use client";

import { useActionState } from "react";

import { DELIVERABLES, MONEY, TIERS, type DeliverableId } from "@/lib/finance-options";

import { type DealState, saveDeal } from "./actions";

const input =
  "rounded-full border border-bh-ink/15 bg-bh-paper px-3 py-1.5 text-xs text-bh-ink placeholder:text-bh-ink/35";
const small =
  "rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink disabled:opacity-50";

const idle: DealState = { status: "idle" };

export type DealFields = {
  id: string;
  tier: string | null;
  amountCents: number | null;
  money: string | null;
  inKindCents: number | null;
  ticketsCount: number | null;
  checked: DeliverableId[];
};

/**
 * The deal: package, money, barter and what the partner gives.
 *
 * A client component only so the form can answer. It used to save silently -
 * no "записано", and no word when a value was refused either - which is
 * indistinguishable from a button that does nothing.
 */
export function DealForm({ partner }: { partner: DealFields }) {
  const [state, action, pending] = useActionState(saveDeal, idle);

  return (
    <form action={action} className="mt-4 rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
      <input type="hidden" name="linkId" value={partner.id} />
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bh-ink/50">Сделката · суми без ДДС</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select name="tier" defaultValue={partner.tier ?? ""} className={input}>
          <option value="">пакет</option>
          {TIERS.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <input
          name="amount"
          inputMode="decimal"
          defaultValue={partner.amountCents === null ? "" : String(partner.amountCents / 100)}
          placeholder="€ сума"
          className={`${input} w-28`}
        />
        <select name="money" defaultValue={partner.money ?? ""} className={input}>
          <option value="">парите</option>
          {MONEY.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <input
          name="inKind"
          inputMode="decimal"
          defaultValue={partner.inKindCents === null ? "" : String(partner.inKindCents / 100)}
          placeholder="€ бартер"
          className={`${input} w-28`}
        />
        <input
          name="tickets"
          type="number"
          min={0}
          defaultValue={partner.ticketsCount ?? ""}
          placeholder="билети"
          className={`${input} w-24`}
        />
      </div>
      <fieldset className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        <legend className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bh-ink/50">Какво дава</legend>
        {DELIVERABLES.map((d) => (
          <label key={d.id} className="flex items-center gap-1.5 text-xs text-bh-ink">
            <input
              type="checkbox"
              name="deliverables"
              value={d.id}
              defaultChecked={partner.checked.includes(d.id)}
              className="h-3.5 w-3.5 accent-[#146455]"
            />
            {d.label}
          </label>
        ))}
      </fieldset>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={small}>
          {pending ? "Записва…" : "Запиши сделката"}
        </button>
        {state.status !== "idle" && (
          <span className={`text-xs ${state.status === "ok" ? "text-[#0b6d61]" : "font-semibold text-red-600"}`}>
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
