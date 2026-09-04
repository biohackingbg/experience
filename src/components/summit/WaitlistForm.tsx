"use client";

import { useActionState } from "react";

import { type WaitlistState, joinWaitlist } from "@/app/bilet/actions";
import type { Lang } from "@/lib/i18n";
import { TICKETS_SECTION } from "@/lib/site-copy";

const idle: WaitlistState = { status: "idle" };

/** Under a sold-out tier: one field, one promise - a message only if a seat frees up. */
export function WaitlistForm({ tierId, dark, lang = "bg" }: { tierId: string; dark?: boolean; lang?: Lang }) {
  const [state, action, pending] = useActionState(joinWaitlist, idle);
  const c = TICKETS_SECTION[lang];
  if (state.status === "ok") {
    return <p className={`mt-8 text-sm ${dark ? "text-bh-lime" : "text-bh-pine"}`}>{lang === "en" ? c.waitDone : state.message}</p>;
  }
  return (
    <form action={action} className="mt-8">
      <input type="hidden" name="tierId" value={tierId} />
      <label className={`block text-xs ${dark ? "text-bh-paper/60" : "text-bh-ink/60"}`}>
        {c.waitTitle}
      </label>
      <div className="mt-2 flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder={c.waitEmail}
          className={`w-full min-w-0 rounded-full px-4 py-2.5 text-sm ${
            dark ? "bg-bh-paper/10 text-bh-paper placeholder:text-bh-paper/40 ring-1 ring-bh-paper/25" : "bg-bh-paper text-bh-ink placeholder:text-bh-ink/35 ring-1 ring-bh-ink/15"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${dark ? "bg-bh-paper text-bh-ink" : "bg-bh-ink text-bh-paper"}`}
        >
          {pending ? "…" : c.waitButton}
        </button>
      </div>
      {state.status === "error" && <p className="mt-1.5 text-xs text-red-500">{state.message}</p>}
    </form>
  );
}
