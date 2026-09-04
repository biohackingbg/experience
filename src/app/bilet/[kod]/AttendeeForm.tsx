"use client";

import { useActionState } from "react";

import { TICKET_PAGE, type Lang } from "@/lib/i18n";

import { type AttendeeState, saveAttendee } from "./actions";

const initial: AttendeeState = { status: "idle" };

/** "Who is this ticket for" - one field, saved in place, editable until the door. */
export function AttendeeForm({ code, current, lang = "bg" }: { code: string; current: string | null; lang?: Lang }) {
  const [state, action, pending] = useActionState(saveAttendee, initial);
  const t = TICKET_PAGE[lang];

  return (
    <form action={action} className="border-t border-bh-ink/8 px-7 py-5 print:hidden">
      <input type="hidden" name="code" value={code} />
      <label htmlFor="attendee" className="block text-sm font-medium text-bh-ink">
        {current ? t.whoTitle : t.whoAsk}
      </label>
      <p className="mt-1 text-xs leading-relaxed text-bh-ink/55">
        {t.whoHint}
      </p>
      <div className="mt-3 flex gap-2">
        <input
          id="attendee"
          name="name"
          defaultValue={current ?? ""}
          maxLength={80}
          placeholder={t.whoPlaceholder}
          className="w-full rounded-full border border-bh-ink/15 bg-bh-paper px-4 py-2.5 text-sm text-bh-ink placeholder:text-bh-ink/35"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-bh-ink px-4 py-2.5 text-sm font-semibold text-bh-paper disabled:opacity-50"
        >
          {pending ? t.saving : t.save}
        </button>
      </div>
      {state.status !== "idle" && (
        <p className={`mt-2 text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{state.message}</p>
      )}
    </form>
  );
}
