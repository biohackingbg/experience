"use client";

import { useActionState } from "react";

import { submitSignup } from "@/app/actions";
import { CONSENT_TEXT, TIERS, tierLabels } from "@/lib/consent";
import { initialSignupState } from "@/lib/signup-state";

const fieldBase =
  "w-full rounded-2xl border border-bh-paper/25 bg-bh-paper/10 px-4 py-3 text-sm text-bh-paper placeholder:text-bh-paper/40 outline-none transition-colors focus:border-bh-lime";

export function EarlyAccessForm({ early }: { early: boolean }) {
  const labels = tierLabels(early);
  const [state, formAction, pending] = useActionState(
    submitSignup,
    initialSignupState,
  );

  if (state.status === "success") {
    return (
      <div className="mt-8 rounded-2xl border border-bh-lime/40 bg-bh-lime/10 p-6">
        <p className="text-base font-semibold text-bh-paper">
          {state.message ?? "Готово!"}
        </p>
        <p className="mt-2 text-sm text-bh-paper/65">
          Пазим само имейла ти и нищо повече. Отписването е с един клик във
          всяко писмо.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 max-w-xl">
      <input type="hidden" name="source" value="register-section" />

      {/* Honeypot: off-screen and hidden from assistive tech, so only bots fill it. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company">Фирма</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="sr-only">
            Име
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Име (по избор)"
            className={fieldBase}
          />
        </div>

        <div>
          <label htmlFor="email" className="sr-only">
            Имейл
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Имейл"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
            className={`${fieldBase} ${
              state.fieldErrors?.email ? "border-red-400" : ""
            }`}
          />
          {state.fieldErrors?.email && (
            <p id="email-error" className="mt-1.5 text-xs text-red-300">
              {state.fieldErrors.email}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor="interestedTier" className="sr-only">
          Кой билет те интересува
        </label>
        <select
          id="interestedTier"
          name="interestedTier"
          defaultValue=""
          className={fieldBase}
        >
          <option value="">Кой билет те интересува? (по избор)</option>
          {TIERS.map((tier) => (
            <option key={tier} value={tier}>
              {labels[tier]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 flex gap-3">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          required
          aria-describedby={state.fieldErrors?.consent ? "consent-error" : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 accent-bh-lime"
        />
        <label htmlFor="consent" className="text-xs leading-relaxed text-bh-paper/65">
          {CONSENT_TEXT}{" "}
          <a
            href="/poveritelnost"
            className="underline underline-offset-2 hover:text-bh-paper"
          >
            Политика за поверителност
          </a>
          .
        </label>
      </div>
      {state.fieldErrors?.consent && (
        <p id="consent-error" className="mt-1.5 text-xs text-red-300">
          {state.fieldErrors.consent}
        </p>
      )}

      {state.status === "error" && state.message && (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bh-gradient mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-bh-ink transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Записваме те…" : "Заяви ранен билет"}
      </button>
    </form>
  );
}
