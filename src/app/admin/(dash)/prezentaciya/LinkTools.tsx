"use client";

import { useActionState, useState } from "react";

import { createDeckLink, type LinkFormState } from "./actions";

// Lives here, not in actions.ts: a "use server" module may export only
// async functions — an exported object fails the build.
const initialLinkFormState: LinkFormState = { status: "idle" };

/** New share link: a label for who it is for, nothing else to fill in. */
export function NewLinkForm() {
  const [state, action, pending] = useActionState(createDeckLink, initialLinkFormState);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        name="label"
        required
        minLength={2}
        maxLength={80}
        placeholder="за кого е — напр. Alma Lasers"
        className="w-64 rounded-full border border-bh-ink/15 bg-bh-paper px-4 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-bh-ink px-4 py-2 text-sm font-semibold text-bh-paper transition-transform hover:-translate-y-0.5 disabled:opacity-50"
      >
        {pending ? "Създава…" : "Нов линк"}
      </button>
      {state.status !== "idle" && (
        <span className={`text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>
          {state.message}
        </span>
      )}
    </form>
  );
}

/** Puts the full URL on the clipboard — the thing you actually do with a link. */
export function CopyLink({ url }: { url: string }) {
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
      className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink"
    >
      {done ? "Копиран ✓" : "Копирай линка"}
    </button>
  );
}

const STAGE_TONE: Record<string, string> = {
  new: "bg-bh-ink/10 text-bh-ink/60",
  contacted: "bg-[#3F6FD8]/15 text-[#2b4fa3]",
  waiting: "bg-[#d0a11a]/20 text-[#7a5b00]",
  confirmed: "bg-[#0E8C7D]/15 text-[#0b6d61]",
  declined: "bg-[#C4607F]/15 text-[#9c3d5c]",
};

type Stage = { id: string; label: string; hint: string };

/**
 * The pipeline cell: stage pill, note and next step at rest; the same three
 * as a small form when opened. One save per link — the row is the deal.
 */
export function PipelineEditor({
  id,
  stage,
  note,
  nextStep,
  stages,
  action,
}: {
  id: string;
  stage: string;
  note: string | null;
  nextStep: string | null;
  stages: readonly Stage[];
  action: (prev: LinkFormState, data: FormData) => Promise<LinkFormState>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: LinkFormState, data: FormData) => {
      const next = await action(prev, data);
      if (next.status === "ok") setOpen(false);
      return next;
    },
    initialLinkFormState,
  );
  const label = stages.find((s) => s.id === stage)?.label ?? stage;

  if (!open) {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Редактирай етап и бележки"
          className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${STAGE_TONE[stage] ?? STAGE_TONE.new}`}
        >
          {label} ✎
        </button>
        {note && <p className="max-w-xs whitespace-pre-line text-xs text-bh-ink/70">{note}</p>}
        {nextStep && (
          <p className="max-w-xs text-xs text-bh-ink">
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bh-ink/45">от нас: </span>
            {nextStep}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-72 flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <select
        name="stage"
        defaultValue={stage}
        className="rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-1.5 text-xs text-bh-ink"
      >
        {stages.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label} — {s.hint}
          </option>
        ))}
      </select>
      <textarea
        name="note"
        defaultValue={note ?? ""}
        rows={3}
        maxLength={1000}
        placeholder="бележка — с кого говорихме, какво казаха"
        className="rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-1.5 text-xs text-bh-ink placeholder:text-bh-ink/35"
      />
      <input
        type="text"
        name="nextStep"
        defaultValue={nextStep ?? ""}
        maxLength={300}
        placeholder="какво се очаква от нас"
        className="rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-1.5 text-xs text-bh-ink placeholder:text-bh-ink/35"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-bh-ink px-3 py-1.5 text-xs font-semibold text-bh-paper disabled:opacity-50"
        >
          {pending ? "Записва…" : "Запиши"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink/70"
        >
          Откажи
        </button>
        {state.status === "error" && <span className="text-xs text-red-600">{state.message}</span>}
      </div>
    </form>
  );
}
