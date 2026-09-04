"use client";

import { useActionState } from "react";

import type { Pricing } from "@/lib/pricing";
import { TIERS, formatPrice } from "@/lib/tickets";

import { type ActionState, saveMidPrices, setStage } from "./actions";

const idle: ActionState = { status: "idle" };
const field = "w-full min-w-0 rounded-full border border-bh-ink/15 bg-bh-paper px-3 py-1.5 text-sm text-bh-ink placeholder:text-bh-ink/35";

const STAGES = [
  { id: "launch", label: "Стартови", hint: "първите 200 билета, цените от кода" },
  { id: "mid", label: "Междинни", hint: "втора стъпка, цените по-долу" },
  { id: "regular", label: "Редовни", hint: "крайните цени от кода" },
] as const;

/**
 * The three price stages as one strip, with the current one lit, and the
 * mid-stage numbers editable underneath. Flipping asks first: the click
 * changes what every visitor is charged from that second.
 */
export function PriceStages({ pricing, sold }: { pricing: Pricing; sold: number }) {
  const [state, action, pending] = useActionState(setStage, idle);
  const [midState, midAction, midPending] = useActionState(saveMidPrices, idle);
  const when = pricing.changedAt
    ? pricing.changedAt.toLocaleString("bg-BG", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" })
    : null;

  return (
    <section className={`rounded-3xl p-6 ring-1 ${pricing.stage === "regular" ? "bg-white ring-[#0b2a22]/6" : "bg-[#cef870]/25 ring-[#8fb832]/40"}`}>
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/55">Цени на сайта</p>
      <p className="mt-1 text-lg font-bold tracking-tight text-bh-ink">
        {STAGES.find((s) => s.id === pricing.stage)?.label} цени{pricing.discounted ? ` · ${pricing.label}` : ""}
      </p>
      <p className="mt-0.5 text-xs text-bh-ink/55">
        {TIERS.map((t) => `${t.name} ${formatPrice(pricing.prices[t.id])} €`).join(" · ")}
        {pricing.stage === "launch" ? ` · продадени ${sold} от 200` : ""}
        {when ? ` · сменено на ${when}` : ""}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {STAGES.map((s) => {
          const active = s.id === pricing.stage;
          return (
            <form
              key={s.id}
              action={action}
              onSubmit={(e) => {
                if (active) return e.preventDefault();
                if (!window.confirm(`Минаваш към ${s.label.toLowerCase()} цени? От този момент всеки нов купувач плаща тях.`)) e.preventDefault();
              }}
            >
              <input type="hidden" name="stage" value={s.id} />
              <button
                type="submit"
                disabled={pending || active}
                title={s.hint}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active ? "bg-bh-ink text-bh-paper" : "border border-bh-ink/25 text-bh-ink hover:border-bh-ink disabled:opacity-50"
                }`}
              >
                {active ? `● ${s.label}` : s.label}
              </button>
            </form>
          );
        })}
        {state.status !== "idle" && (
          <span className={`self-center text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{state.message}</span>
        )}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-semibold text-bh-ink/70">Междинни цени и надпис</summary>
        <form action={midAction} className="mt-3 grid gap-2 sm:grid-cols-3">
          {TIERS.map((t) => (
            <label key={t.id} className="text-xs text-bh-ink/60">
              {t.name}, € с ДДС
              <input name={`price_${t.id}`} inputMode="decimal" defaultValue={pricing.mid.prices[t.id] / 100} className={`${field} mt-1`} />
            </label>
          ))}
          <label className="text-xs text-bh-ink/60 sm:col-span-1">
            надпис („до 15 октомври“)
            <input name="label" defaultValue={pricing.mid.label} maxLength={60} className={`${field} mt-1`} />
          </label>
          <label className="text-xs text-bh-ink/60 sm:col-span-1">
            под зачертаната цена („след 15 октомври“)
            <input name="after" defaultValue={pricing.mid.regularAfter} maxLength={60} className={`${field} mt-1`} />
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={midPending} className="rounded-full border border-bh-ink/25 px-4 py-1.5 text-xs font-semibold text-bh-ink disabled:opacity-50">
              {midPending ? "Записва…" : "Запиши"}
            </button>
            {midState.status !== "idle" && (
              <span className={`text-xs ${midState.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{midState.message}</span>
            )}
          </div>
        </form>
      </details>
    </section>
  );
}
