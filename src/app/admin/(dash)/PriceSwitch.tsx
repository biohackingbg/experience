"use client";

import { useActionState } from "react";

import { type ActionState, setEarlyAccess } from "./actions";

const initial: ActionState = { status: "idle" };

/**
 * The launch-price switch. One button, worded as the thing it does, with a
 * confirm - the click changes what every visitor is charged from that second.
 */
export function PriceSwitch({ open, changedAt, sold }: { open: boolean; changedAt: Date | null; sold: number }) {
  const [state, action, pending] = useActionState(setEarlyAccess, initial);
  const when = changedAt
    ? changedAt.toLocaleString("bg-BG", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" })
    : null;

  return (
    <section
      className={`mt-6 rounded-2xl px-6 py-5 ring-1 ${
        open ? "bg-[#cef870]/25 ring-[#8fb832]/40" : "bg-bh-cloud ring-bh-ink/8"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/55">Цени на сайта</p>
          <p className="mt-1 text-lg font-bold tracking-tight text-bh-ink">
            {open ? "Стартови цени за първите 200 билета" : "Редовни цени"}
          </p>
          <p className="mt-0.5 text-xs text-bh-ink/55">
            {open
              ? `продадени ${sold} от 200 стартови · ключът спира цените веднага, навсякъде`
              : when
                ? `стартовите цени са спрени на ${when}`
                : "стартовите цени са спрени"}
          </p>
        </div>
        <form
          action={action}
          onSubmit={(e) => {
            const q = open
              ? "Спираш стартовите цени? От този момент всеки нов купувач плаща редовната цена."
              : "Връщаш стартовите цени за всички?";
            if (!window.confirm(q)) e.preventDefault();
          }}
          className="flex items-center gap-3"
        >
          <input type="hidden" name="to" value={open ? "off" : "on"} />
          <button
            type="submit"
            disabled={pending}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-50 ${
              open ? "bg-bh-ink text-bh-paper" : "border border-bh-ink/25 text-bh-ink"
            }`}
          >
            {pending ? "Превключва…" : open ? "Спри стартовите цени" : "Върни стартовите цени"}
          </button>
          {state.status !== "idle" && (
            <span className={`text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>
              {state.message}
            </span>
          )}
        </form>
      </div>
    </section>
  );
}
