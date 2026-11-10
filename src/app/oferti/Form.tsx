"use client";

import { useActionState, useState } from "react";

import { type LoginState, loginStep } from "./actions";

const field = "mt-2 w-full rounded-full border border-bh-ink/15 bg-bh-cloud px-4 py-3 text-sm text-bh-ink placeholder:text-bh-ink/35";

const T = {
  bg: {
    email: "Имейлът, с който е билетът", send: "Прати ми код", sending: "Праща…",
    pin: (e: string) => `Пратихме 6-цифрен код на ${e}. Въведи го тук.`, check: "Влез", checking: "Проверява…", restart: "Друг имейл",
  },
  en: {
    email: "The email your ticket is under", send: "Send me a code", sending: "Sending…",
    pin: (e: string) => `We sent a 6-digit code to ${e}. Enter it here.`, check: "Sign in", checking: "Checking…", restart: "Another email",
  },
} as const;

export function LoginForm({ lang }: { lang: "bg" | "en" }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginStep, { step: "email" });
  const t = T[lang];

  if (state.step === "code") {
    return (
      <form action={action} className="mt-8">
        <input type="hidden" name="lang" value={lang} />
        <p className="text-sm leading-relaxed text-bh-ink/70">{t.pin(state.email)}</p>
        <input name="pin" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus className={`${field} text-center font-mono text-2xl tracking-[0.4em]`} />
        <button type="submit" disabled={pending} className="mt-4 w-full rounded-full bg-bh-ink px-5 py-3 text-sm font-semibold text-bh-paper disabled:opacity-50">
          {pending ? t.checking : t.check}
        </button>
        <button type="submit" name="intent" value="restart" formNoValidate className="mt-3 w-full text-xs font-semibold text-bh-ink/55 underline underline-offset-2">
          {t.restart}
        </button>
        {state.error && <p className="mt-3 text-sm text-red-700">{state.error}</p>}
      </form>
    );
  }

  return (
    <form action={action} className="mt-8">
      <input type="hidden" name="lang" value={lang} />
      <label className="block text-sm font-medium text-bh-ink" htmlFor="email">{t.email}</label>
      <input id="email" name="email" type="email" defaultValue={state.email ?? ""} required autoComplete="email" className={field} />
      <button type="submit" disabled={pending} className="mt-4 w-full rounded-full bg-bh-ink px-5 py-3 text-sm font-semibold text-bh-paper disabled:opacity-50">
        {pending ? t.sending : t.send}
      </button>
      {state.error && <p className="mt-3 text-sm text-red-700">{state.error}</p>}
    </form>
  );
}

/** The promo code, large enough to read out at a desk, with one tap to copy it. */
export function CopyCode({ code, lang }: { code: string; lang: "bg" | "en" }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(code).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          },
          () => {},
        );
      }}
      className="inline-flex items-center gap-3 rounded-full border border-dashed border-bh-ink/30 bg-white px-4 py-2 text-left"
      aria-label={lang === "en" ? `Copy code ${code}` : `Копирай кода ${code}`}
    >
      <span className="font-mono text-base font-bold tracking-widest text-bh-ink">{code}</span>
      <span className="text-xs font-semibold text-bh-pine">{copied ? (lang === "en" ? "Copied" : "Копиран") : lang === "en" ? "Copy" : "Копирай"}</span>
    </button>
  );
}
