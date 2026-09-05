"use client";

import { useActionState, useState } from "react";

import { AUDIENCES, type Audience } from "@/lib/newsletter-options";

import { type MailState, sendTest, sendToList } from "./actions";

const idle: MailState = { status: "idle" };
const field =
  "w-full min-w-0 rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";

function Msg({ s }: { s: MailState }) {
  if (s.status === "idle") return null;
  return <span className={`text-xs ${s.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{s.message}</span>;
}

/**
 * Writing to a list, with the two guards that matter: the count of who will
 * receive it is on the button itself, and sending asks first. A test to one
 * address goes through the same template, so what you check is what they get.
 */
export function MailForm({ counts }: { counts: Record<Audience, number> }) {
  const [audience, setAudience] = useState<Audience>("signups");
  const [testState, testAction, testPending] = useActionState(sendTest, idle);
  const [sendState, sendAction, sendPending] = useActionState(sendToList, idle);
  const n = counts[audience] ?? 0;

  return (
    <form className="mt-4 flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {AUDIENCES.map((a) => (
          <label
            key={a.id}
            title={a.note}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              audience === a.id ? "bg-bh-ink text-bh-paper" : "bg-bh-ink/8 text-bh-ink/70 hover:bg-bh-ink/15"
            }`}
          >
            <input
              type="radio"
              name="audience"
              value={a.id}
              checked={audience === a.id}
              onChange={() => setAudience(a.id)}
              className="sr-only"
            />
            {a.label} · {counts[a.id] ?? 0}
          </label>
        ))}
      </div>
      <p className="text-xs text-bh-ink/55">{AUDIENCES.find((a) => a.id === audience)?.note}</p>

      <input name="subject" required placeholder="заглавие на писмото" className={field} maxLength={160} />
      <textarea
        name="body"
        required
        rows={8}
        placeholder={"Текстът, както го пишеш.\n\nПразен ред започва нов абзац."}
        className={field}
        maxLength={8000}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input name="ctaLabel" placeholder="надпис на бутона (по избор)" className={field} maxLength={60} />
        <input name="ctaUrl" type="url" placeholder="https://thelongevitysummit.eu/#tickets" className={field} maxLength={300} />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-bh-ink/10 pt-3">
        <input name="testTo" type="email" placeholder="имейл за проба" className={`${field} sm:w-64`} />
        <button
          type="submit"
          formAction={testAction}
          disabled={testPending}
          className="rounded-full border border-bh-ink/20 px-4 py-2 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink disabled:opacity-50"
        >
          {testPending ? "…" : "Прати проба"}
        </button>
        <Msg s={testState} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          formAction={sendAction}
          disabled={sendPending || n === 0}
          onClick={(e) => {
            if (!window.confirm(`Изпращаш писмото до ${n} души. Това не се връща. Готова ли си?`)) e.preventDefault();
          }}
          className="rounded-full bg-bh-ink px-6 py-2.5 text-sm font-semibold text-bh-paper disabled:opacity-50"
        >
          {sendPending ? "Изпраща…" : `Изпрати до ${n} души`}
        </button>
        <Msg s={sendState} />
      </div>
    </form>
  );
}
