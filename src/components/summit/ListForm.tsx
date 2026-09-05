"use client";

import { useActionState } from "react";

import { submitSignup } from "@/app/actions";
import { CONSENT_TEXT } from "@/lib/consent";
import type { Lang } from "@/lib/i18n";
import { initialSignupState } from "@/lib/signup-state";
import { LIST } from "@/lib/site-copy";

/**
 * One field and a consent box, on the page and in the footer.
 *
 * Deliberately not beside the ticket cards: a free way forward standing next
 * to a paid one takes buyers, not just the undecided. It sits after the
 * line-up, where someone who has read the names but is not ready today has a
 * reason to leave an address.
 */
export function ListForm({
  lang = "bg",
  source,
  variant = "section",
}: {
  lang?: Lang;
  source: string;
  variant?: "section" | "footer";
}) {
  const c = LIST[lang];
  const [state, action, pending] = useActionState(submitSignup, initialSignupState);
  const dark = variant === "section";

  if (state.status === "success") {
    return (
      <p className={`text-sm font-medium ${dark ? "text-bh-lime" : "text-bh-pine"}`}>{c.done}</p>
    );
  }

  const field = dark
    ? "w-full min-w-0 rounded-full border border-bh-paper/25 bg-bh-paper/10 px-5 py-3 text-sm text-bh-paper placeholder:text-bh-paper/45 outline-none transition-colors focus:border-bh-lime"
    : "w-full min-w-0 rounded-full border border-bh-ink/20 bg-bh-paper px-4 py-2.5 text-sm text-bh-ink placeholder:text-bh-ink/40 outline-none transition-colors focus:border-bh-ink";

  return (
    <form action={action} className={variant === "footer" ? "mt-3 max-w-sm" : "mt-6 max-w-lg"}>
      <input type="hidden" name="source" value={source} />
      {/* Honeypot: off-screen, so only bots fill it. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={`company-${source}`}>Фирма</label>
        <input id={`company-${source}`} name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <label htmlFor={`email-${source}`} className="sr-only">
          {c.placeholder}
        </label>
        <input
          id={`email-${source}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={c.placeholder}
          className={field}
        />
        <button
          type="submit"
          disabled={pending}
          className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-60 ${
            dark ? "bg-bh-lime text-bh-ink" : "bg-bh-ink text-bh-paper"
          }`}
        >
          {pending ? "…" : variant === "footer" ? c.footerButton : c.button}
        </button>
      </div>

      <label
        className={`mt-3 flex items-start gap-2 text-xs leading-relaxed ${dark ? "text-bh-paper/60" : "text-bh-ink/60"}`}
      >
        <input type="checkbox" name="consent" required className="mt-0.5 h-3.5 w-3.5 accent-[#146455]" />
        <span title={CONSENT_TEXT}>{c.consent}</span>
      </label>

      {state.status === "error" && (
        <p className={`mt-2 text-xs ${dark ? "text-bh-lime" : "text-red-600"}`}>{state.message}</p>
      )}
    </form>
  );
}
