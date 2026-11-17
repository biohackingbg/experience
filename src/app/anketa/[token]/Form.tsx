"use client";

import { useActionState, useState } from "react";

import { EARLY_CONSENT, EARLY_YES, MAX_EXTRA_EMAILS, type Question } from "@/lib/survey-questions";

import { type SurveyState, submitAnswers } from "./actions";

const box = "rounded-3xl bg-white p-5 ring-1 ring-bh-ink/8 sm:p-6";
const field = "mt-3 w-full rounded-2xl border border-bh-ink/15 bg-bh-cloud px-4 py-3 text-sm text-bh-ink placeholder:text-bh-ink/35 focus:border-bh-pine focus:outline-none";
const chip =
  "flex cursor-pointer items-center gap-3 rounded-2xl border border-bh-ink/12 bg-bh-cloud px-4 py-3 text-sm text-bh-ink transition-colors has-[:checked]:border-bh-pine has-[:checked]:bg-bh-pine/10";

function Scale({ q }: { q: Extract<Question, { kind: "scale" }> }) {
  const values = Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i);
  return (
    <>
      <div className={`mt-4 grid gap-1.5 ${q.max === 10 ? "grid-cols-11" : "grid-cols-5"}`}>
        {values.map((v) => (
          <label key={v} className="cursor-pointer">
            <input type="radio" name={q.id} value={v} required={q.required} className="peer sr-only" />
            <span className="flex h-11 items-center justify-center rounded-xl border border-bh-ink/12 bg-bh-cloud text-sm font-semibold text-bh-ink transition-colors peer-checked:border-bh-ink peer-checked:bg-bh-ink peer-checked:text-bh-paper peer-focus-visible:ring-2 peer-focus-visible:ring-bh-pine">
              {v}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-bh-ink/50">
        <span>{q.low}</span>
        <span>{q.high}</span>
      </div>
    </>
  );
}

function Choice({ q, preset }: { q: Extract<Question, { kind: "single" | "multi" }>; preset?: string | null }) {
  const multi = q.kind === "multi";
  const [other, setOther] = useState(false);
  return (
    <div className="mt-4 grid gap-2">
      {q.options.map((o) => (
        <label key={o} className={chip}>
          <input
            type={multi ? "checkbox" : "radio"}
            name={q.id}
            value={o}
            defaultChecked={preset === o}
            required={!multi && q.required}
            onChange={multi ? undefined : () => setOther(false)}
            className="h-4 w-4 accent-[#146455]"
          />
          {o}
        </label>
      ))}
      {q.other && (
        <label className={chip}>
          <input
            type={multi ? "checkbox" : "radio"}
            name={multi ? `${q.id}__otherOn` : q.id}
            value="__other"
            onChange={(e) => setOther(e.target.checked)}
            className="h-4 w-4 accent-[#146455]"
          />
          Друго
        </label>
      )}
      {q.other && other && <input name={`${q.id}__other`} placeholder="Напиши…" maxLength={200} className={field} autoFocus />}
    </div>
  );
}

function Early({ q, holderEmail }: { q: Extract<Question, { kind: "early" }>; holderEmail: string | null }) {
  const [yes, setYes] = useState(false);
  const [emails, setEmails] = useState<string[]>([holderEmail ?? ""]);
  return (
    <>
      <div className="mt-4 grid gap-2">
        {[EARLY_YES, "Не, благодаря"].map((o) => (
          <label key={o} className={chip}>
            <input type="radio" name={q.id} value={o} onChange={() => setYes(o === EARLY_YES)} className="h-4 w-4 accent-[#146455]" />
            {o}
          </label>
        ))}
      </div>
      {yes && (
        <div className="mt-4">
          <p className="text-sm text-bh-ink/70">На кой имейл да ти пишем? Можеш да добавиш и приятели, които искат ранен достъп.</p>
          {emails.map((e, i) => (
            <input
              key={i}
              type="email"
              name="earlyEmail"
              defaultValue={e}
              required={i === 0}
              placeholder={i === 0 ? "Твоят имейл" : "Имейл на приятел"}
              className={field}
            />
          ))}
          {emails.length <= MAX_EXTRA_EMAILS && (
            <button type="button" onClick={() => setEmails([...emails, ""])} className="mt-3 text-sm font-semibold text-bh-pine underline underline-offset-2">
              + добави още един имейл
            </button>
          )}
          <p className="mt-3 text-xs leading-relaxed text-bh-ink/50">
            {EARLY_CONSENT} Всеки добавен приятел получава писмо и влиза в списъка, само ако сам потвърди.
          </p>
        </div>
      )}
    </>
  );
}

export function SurveyForm({
  token,
  questions,
  presets,
  holderEmail,
  partner,
}: {
  token: string;
  questions: Question[];
  presets: Record<string, string | null>;
  holderEmail: string | null;
  partner: boolean;
}) {
  const [state, action, pending] = useActionState<SurveyState, FormData>(submitAnswers.bind(null, token), { status: "idle" });

  if (state.status === "done") {
    return (
      <div className={`mt-8 ${box}`}>
        <p className="text-2xl font-bold text-bh-ink">{partner ? "Благодарим Ви!" : "Благодарим ти!"} 💚</p>
        <p className="mt-3 text-sm leading-relaxed text-bh-ink/70">
          {partner
            ? "Отговорите Ви са записани. Ще Ви изпратим отчета за събитието, след като съберем всички отговори."
            : "Отговорите ти са записани. Ще ги прочетем всичките и ще направим следващото издание още по-добро."}
        </p>
        {!!state.confirmSent?.length && (
          <p className="mt-3 text-sm leading-relaxed text-bh-ink/70">
            Пратихме писмо за потвърждение на {state.confirmSent.join(", ")}. Влизат в списъка за ранен достъп, след като потвърдят.
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 space-y-4">
      {questions.map((q, i) => (
        <fieldset key={q.id} className={box}>
          <legend className="sr-only">{q.label}</legend>
          <p className="text-base font-semibold leading-snug text-bh-ink">
            <span className="mr-2 text-bh-ink/35">{i + 1}.</span>
            {q.label}
            {"required" in q && q.required && <span className="text-bh-pine"> *</span>}
          </p>
          {q.kind === "scale" && <Scale q={q} />}
          {(q.kind === "single" || q.kind === "multi") && <Choice q={q} preset={presets[q.id]} />}
          {q.kind === "text" &&
            (q.long ? (
              <textarea name={q.id} rows={3} maxLength={2000} defaultValue={presets[q.id] ?? ""} className={field} />
            ) : (
              <input name={q.id} maxLength={300} defaultValue={presets[q.id] ?? ""} required={q.required} className={field} />
            ))}
          {q.kind === "early" && <Early q={q} holderEmail={holderEmail} />}
        </fieldset>
      ))}
      {state.status === "error" && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{state.error}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-full bg-bh-ink px-6 py-4 text-base font-semibold text-bh-paper disabled:opacity-50">
        {pending ? "Изпраща…" : "Изпрати отговорите"}
      </button>
    </form>
  );
}
