"use client";

import { useActionState } from "react";

import { type ResendState, issueCreditNote } from "./actions";

const initial: ResendState = { status: "idle" };

/**
 * The credit note for a partial refund. The tier is asked for only when the
 * order has more than one kind of ticket; the codes are optional, for when the
 * tickets still have to be cancelled (they may already be gone).
 */
export function CreditNoteForm({ reference, tiers }: { reference: string; tiers: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(issueCreditNote, initial);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Да издам ли кредитно известие? Номерът му се взема от общата поредица и не може да се върне.")) e.preventDefault();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="reference" value={reference} />
      {tiers.length > 1 && (
        <select name="tier" required className="rounded-full border border-bh-ink/15 bg-bh-paper px-3 py-1.5 text-xs text-bh-ink">
          {tiers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}
      <input
        type="number"
        name="quantity"
        min={1}
        defaultValue={1}
        title="Колко билета се връщат"
        className="w-16 rounded-full border border-bh-ink/15 bg-bh-paper px-3 py-1.5 text-xs text-bh-ink"
      />
      <input
        type="text"
        name="codes"
        placeholder="кодове за анулиране (по избор)"
        className="w-52 rounded-full border border-bh-ink/15 bg-bh-paper px-3 py-1.5 text-xs text-bh-ink placeholder:text-bh-ink/35"
      />
      <button type="submit" disabled={pending} className="rounded-full bg-[#9c3d5c] px-3 py-1.5 text-xs font-semibold text-bh-paper disabled:opacity-50">
        {pending ? "Издава…" : "Кредитно за част"}
      </button>
      {state.status !== "idle" && <span className={`text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{state.message}</span>}
    </form>
  );
}
