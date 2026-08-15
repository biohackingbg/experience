"use client";

import { useActionState } from "react";

import { type ResendState, resendTicketEmail } from "./actions";

const initialResendState: ResendState = { status: "idle" };

/**
 * Re-delivers the ticket email, to the buyer's address or to another one.
 *
 * The address field is left empty on purpose: sending to the address on the
 * order is the common case, and typing one should be a deliberate act.
 */
export function ResendForm({ reference }: { reference: string }) {
  const [state, action, pending] = useActionState(
    resendTicketEmail,
    initialResendState,
  );

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="reference" value={reference} />
      <input
        type="email"
        name="email"
        placeholder="друг имейл (по избор)"
        className="w-48 rounded-full border border-bh-ink/15 bg-bh-paper px-3 py-1.5 text-xs text-bh-ink placeholder:text-bh-ink/35"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-bh-ink px-3 py-1.5 text-xs font-semibold text-bh-paper disabled:opacity-50"
      >
        {pending ? "Изпраща…" : "Прати пак"}
      </button>
      {state.status !== "idle" && (
        <span
          className={`text-xs ${
            state.status === "ok" ? "text-bh-pine" : "text-red-600"
          }`}
        >
          {state.message}
        </span>
      )}
    </form>
  );
}
