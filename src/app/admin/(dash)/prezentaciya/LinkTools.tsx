"use client";

import { useActionState, useState } from "react";

import { createDeckLink, createDeckLinksBulk, type LinkFormState } from "./actions";
import { MONEY, TIERS } from "@/lib/deck-links";

// Lives here, not in actions.ts: a "use server" module may export only
// async functions - an exported object fails the build.
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
        placeholder="за кого е - напр. Alma Lasers"
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

/** Puts the full URL on the clipboard - the thing you actually do with a link. */
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
 * as a small form when opened. One save per link - the row is the deal.
 */
export function PipelineEditor({
  id,
  stage,
  note,
  nextStep,
  owner,
  tier,
  amountCents,
  money,
  owners,
  stages,
  action,
}: {
  id: string;
  stage: string;
  note: string | null;
  nextStep: string | null;
  owner: string | null;
  tier: string | null;
  amountCents: number | null;
  money: string | null;
  /** Names already in use, offered as suggestions. */
  owners: string[];
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
      <div className="flex min-w-[18rem] max-w-md flex-col items-start gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            title="Редактирай етап, бележки и кой води"
            className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${STAGE_TONE[stage] ?? STAGE_TONE.new}`}
          >
            {label} ✎
          </button>
          {owner ? (
            <span
              title="Води комуникацията"
              className="inline-flex items-center gap-1.5 rounded-full border border-bh-ink/15 py-1 pl-1 pr-2.5 text-xs font-medium text-bh-ink"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-bh-ink text-[0.6rem] font-bold uppercase text-bh-paper">
                {owner.trim().slice(0, 1)}
              </span>
              {owner}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-full border border-dashed border-bh-ink/25 px-2.5 py-1 text-xs text-bh-ink/50 hover:border-bh-ink/50 hover:text-bh-ink"
            >
              + кой води
            </button>
          )}
        </div>
        {(amountCents !== null || tier) && (
          <p className="text-sm text-bh-ink">
            {tier && <span className="text-bh-ink/60">{TIERS.find((t) => t.id === tier)?.label ?? tier} · </span>}
            {amountCents !== null && (
              <span className="font-semibold">{(amountCents / 100).toLocaleString("bg-BG")} €</span>
            )}
            {money && (
              <span className="ml-2 rounded-full bg-bh-ink/8 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-bh-ink/70">
                {MONEY.find((m) => m.id === money)?.label ?? money}
              </span>
            )}
          </p>
        )}
        {note && <p className="whitespace-pre-line text-sm leading-relaxed text-bh-ink/80">{note}</p>}
        {nextStep && (
          <p className="rounded-xl bg-bh-lime-pale/40 px-3 py-2 text-sm leading-snug text-bh-ink">
            <span className="mr-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bh-ink/55">от нас</span>
            {nextStep}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-[26rem] max-w-full flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <div className="grid grid-cols-[1fr_9rem] gap-2">
        <select
          name="stage"
          defaultValue={stage}
          className="rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink"
        >
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} - {s.hint}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="owner"
          list={`owners-${id}`}
          defaultValue={owner ?? ""}
          maxLength={40}
          placeholder="кой води"
          className="rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35"
        />
        <datalist id={`owners-${id}`}>
          {owners.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      </div>
      <textarea
        name="note"
        defaultValue={note ?? ""}
        rows={5}
        maxLength={1000}
        placeholder="бележка - с кого говорихме, какво казаха"
        className="rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm leading-relaxed text-bh-ink placeholder:text-bh-ink/35"
      />
      {/* The deal itself. Net of VAT, in euros - the accountant's number,
          not the invoice total. */}
      <div className="grid grid-cols-[1fr_7rem_1fr] gap-2">
        <select
          name="tier"
          defaultValue={tier ?? ""}
          className="rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink"
        >
          <option value="">пакет</option>
          {TIERS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          inputMode="decimal"
          name="amount"
          defaultValue={amountCents === null ? "" : String(amountCents / 100)}
          placeholder="€ без ДДС"
          className="rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35"
        />
        <select
          name="money"
          defaultValue={money ?? ""}
          className="rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink"
        >
          <option value="">парите</option>
          {MONEY.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <input
        type="text"
        name="nextStep"
        defaultValue={nextStep ?? ""}
        maxLength={300}
        placeholder="какво се очаква от нас"
        className="rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35"
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

/**
 * Paste a column of company names (straight out of a spreadsheet) and get a
 * link per line, all assigned to whoever is pasting. Names that already have
 * a link are skipped, so the same list can be pasted again as it grows.
 */
export function BulkLinkForm({ owners }: { owners: string[] }) {
  const [state, action, pending] = useActionState(createDeckLinksBulk, initialLinkFormState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-bh-ink/20 px-4 py-2 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink"
      >
        Добави няколко наведнъж
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/70">
          Кой води
        </label>
        <input
          type="text"
          name="owner"
          list="bulk-owners"
          maxLength={40}
          placeholder="твоето име"
          className="w-48 rounded-full border border-bh-ink/15 bg-bh-paper px-4 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35"
        />
        <datalist id="bulk-owners">
          {owners.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
        <span className="text-xs text-bh-ink/60">- всички от списъка се записват на този човек</span>
      </div>
      <textarea
        name="labels"
        rows={8}
        required
        placeholder={"Постави имената, по едно на ред:\nAlma Lasers\nBENU\nGlycanAge"}
        className="w-full rounded-2xl border border-bh-ink/15 bg-bh-paper px-4 py-3 text-sm leading-relaxed text-bh-ink placeholder:text-bh-ink/35"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-bh-ink px-4 py-2 text-sm font-semibold text-bh-paper transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          {pending ? "Създава…" : "Създай линковете"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-bh-ink/20 px-4 py-2 text-sm font-semibold text-bh-ink/70"
        >
          Затвори
        </button>
        {state.status !== "idle" && (
          <span className={`text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}

/**
 * Reissuing an address breaks the link already in a partner's inbox, so it
 * asks first. Everything else about the row survives.
 */
export function RegenerateButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        const ok = window.confirm(
          `Нов адрес за „${label}"?\n\nСтарият линк спира да работи веднага - използвай това само ако партньорът не е успял да отвори своя. Отварянията, етапът и бележките остават.`,
        );
        if (!ok) e.preventDefault();
      }}
      className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink/70 transition-colors hover:border-bh-ink hover:text-bh-ink"
    >
      Нов адрес
    </button>
  );
}
