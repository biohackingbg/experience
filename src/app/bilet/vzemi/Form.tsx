"use client";

import { useActionState } from "react";

import { type ClaimState, claimStep } from "./actions";

const field = "mt-2 w-full rounded-full border border-bh-ink/15 bg-bh-cloud px-4 py-3 text-sm text-bh-ink placeholder:text-bh-ink/35";
const label = "mt-5 block text-sm font-medium text-bh-ink";

const T = {
  bg: {
    code: "Номер на билета", codeHint: "ABCD-EFGH", name: "Име и фамилия", email: "Твоят имейл", send: "Прати ми код", sending: "Праща…",
    pin: (e: string) => `Пратихме 6-цифрен код на ${e}. Въведи го тук.`, check: "Потвърди", checking: "Проверява…", restart: "Друг имейл или билет",
    done: (n: string) => `Готово, ${n}! Билетът е твой.`,
    next: (e: string) => `Влез в приложението Sofia Life Summit с ${e}: билетът ти е там. Пратихме ти и писмо с линковете.`,
    app: "Отвори приложението",
  },
  en: {
    code: "Ticket number", codeHint: "ABCD-EFGH", name: "Full name", email: "Your email", send: "Send me a code", sending: "Sending…",
    pin: (e: string) => `We sent a 6-digit code to ${e}. Enter it here.`, check: "Confirm", checking: "Checking…", restart: "Another email or ticket",
    done: (n: string) => `Done, ${n}! The ticket is yours.`,
    next: (e: string) => `Sign in to the Sofia Life Summit app with ${e}: your ticket is there. We also sent you an email with the links.`,
    app: "Open the app",
  },
} as const;

export function ClaimForm({ lang, initialCode }: { lang: "bg" | "en"; initialCode?: string }) {
  const [state, action, pending] = useActionState<ClaimState, FormData>(claimStep, { step: "details", code: initialCode });
  const t = T[lang];

  if (state.step === "done") {
    return (
      <div className="mt-8 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
        <p className="text-lg font-bold text-bh-ink">{t.done(state.name.split(/\s+/)[0])}</p>
        <p className="mt-2 text-sm leading-relaxed text-bh-ink/70">{t.next(state.email)}</p>
        <a href="/app" className="mt-5 inline-block rounded-full bg-bh-ink px-5 py-3 text-sm font-semibold text-bh-paper">{t.app}</a>
      </div>
    );
  }

  if (state.step === "verify") {
    return (
      <form action={action} className="mt-8">
        <input type="hidden" name="lang" value={lang} />
        <p className="text-sm leading-relaxed text-bh-ink/70">{t.pin(state.email)}</p>
        <input name="pin" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required className={`${field} text-center font-mono text-2xl tracking-[0.4em]`} />
        <button type="submit" disabled={pending} className="mt-4 w-full rounded-full bg-bh-ink px-5 py-3 text-sm font-semibold text-bh-paper disabled:opacity-50">
          {pending ? t.checking : t.check}
        </button>
        <button type="submit" name="intent" value="restart" className="mt-3 w-full text-xs font-semibold text-bh-ink/55 underline underline-offset-2">
          {t.restart}
        </button>
        {state.error && <p className="mt-3 text-sm text-red-700">{state.error}</p>}
      </form>
    );
  }

  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="lang" value={lang} />
      <label className={label} htmlFor="code">{t.code}</label>
      <input id="code" name="code" defaultValue={state.code ?? ""} placeholder={t.codeHint} required autoCapitalize="characters" autoComplete="off" className={`${field} font-mono uppercase tracking-widest`} />
      <label className={label} htmlFor="name">{t.name}</label>
      <input id="name" name="name" defaultValue={state.name ?? ""} required maxLength={80} autoComplete="name" className={field} />
      <label className={label} htmlFor="email">{t.email}</label>
      <input id="email" name="email" type="email" defaultValue={state.email ?? ""} required autoComplete="email" className={field} />
      <button type="submit" disabled={pending} className="mt-6 w-full rounded-full bg-bh-ink px-5 py-3 text-sm font-semibold text-bh-paper disabled:opacity-50">
        {pending ? t.sending : t.send}
      </button>
      {state.error && <p className="mt-3 text-sm text-red-700">{state.error}</p>}
    </form>
  );
}
