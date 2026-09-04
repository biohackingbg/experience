"use client";

import { useActionState } from "react";

import { RESEND_PAGE, type Lang } from "@/lib/i18n";

import { type ResendState, resendMyTickets } from "./actions";

const initial: ResendState = { status: "idle" };

export function MyTicketsForm({ lang }: { lang: Lang }) {
  const [state, action, pending] = useActionState(resendMyTickets, initial);
  const t = RESEND_PAGE[lang];

  return (
    <form action={action} className="mt-8">
      <input type="hidden" name="lang" value={lang} />
      <label htmlFor="email" className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50">{t.email}</label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="mt-2 w-full rounded-2xl border border-bh-ink/15 bg-bh-cloud px-4 py-3 text-bh-ink outline-none focus:border-bh-pine"
      />
      <button
        type="submit"
        disabled={pending}
        className="bh-gradient mt-4 w-full rounded-full px-6 py-3.5 text-sm font-semibold text-bh-ink transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? t.sending : t.send}
      </button>
      {state.status !== "idle" && (
        <p className={`mt-4 rounded-2xl px-4 py-3 text-sm ${state.status === "ok" ? "bg-bh-cloud text-bh-ink/75 ring-1 ring-bh-ink/10" : "text-red-700"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
