"use client";

import { useActionState, useState } from "react";

import type { CampaignRow } from "@/lib/marketing";
import { KINDS, PLATFORMS, campaignLink, kindLabel, platformLabel } from "@/lib/marketing-options";
import { formatPrice } from "@/lib/tickets";

import { type FormState, createCampaign, editCampaign, removeCampaign } from "./actions";

const idle: FormState = { status: "idle" };
const field =
  "rounded-full border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";
const small = "rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink";

const sofiaDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(d);
const sofiaTime = (d: Date) =>
  d.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia", hour12: false });

function Msg({ s }: { s: FormState }) {
  if (s.status === "idle") return null;
  return <span className={`text-xs ${s.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{s.message}</span>;
}

/** The shared field set: what was posted, where, what it cost, what the platform reported. */
function Fields({ c }: { c?: CampaignRow }) {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-[9rem_6rem_10rem_10rem_1fr]">
        <input type="date" name="date" defaultValue={c ? sofiaDate(c.postedAt) : sofiaDate(new Date())} className={field} required />
        <input type="time" name="time" defaultValue={c ? sofiaTime(c.postedAt) : "12:00"} className={field} />
        <select name="platform" defaultValue={c?.platform ?? ""} required className={field}>
          <option value="" disabled>платформа</option>
          {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <select name="kind" defaultValue={c?.kind ?? "post"} className={field}>
          {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
        <input name="title" defaultValue={c?.title ?? ""} required maxLength={160} placeholder="за какво е публикацията" className={field} />
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-[1fr_12rem_8rem_1fr]">
        <input name="url" defaultValue={c?.url ?? ""} placeholder="линк към публикацията (по избор)" className={field} />
        <input name="utm" defaultValue={c?.utmCampaign ?? ""} placeholder="UTM код (празно = автоматичен)" className={field} />
        <input name="spend" inputMode="decimal" defaultValue={c && c.spendCents ? (c.spendCents / 100).toString() : ""} placeholder="€ платено" className={field} />
        <input name="note" defaultValue={c?.note ?? ""} maxLength={300} placeholder="бележка" className={field} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {(["reach", "likes", "comments", "saves", "clicks"] as const).map((k) => (
          <input
            key={k}
            name={k}
            inputMode="numeric"
            defaultValue={c?.[k] ?? ""}
            placeholder={{ reach: "достигнати", likes: "харесвания", comments: "коментари", saves: "запазвания", clicks: "кликове" }[k]}
            className={field}
          />
        ))}
      </div>
    </>
  );
}

export function CampaignForm() {
  const [state, action, pending] = useActionState(createCampaign, idle);
  return (
    <form action={action}>
      <Fields />
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-sm font-semibold text-bh-paper disabled:opacity-50">
          {pending ? "Записва…" : "Добави"}
        </button>
        <Msg s={state} />
      </div>
    </form>
  );
}

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
      className={small}
    >
      {done ? "Копиран ✓" : "Копирай линка"}
    </button>
  );
}

const n = (v: number | null) => (v === null ? "-" : v.toLocaleString("bg-BG"));

/** One campaign: the log line, the numbers, and the same fields for correcting it. */
export function CampaignItem({ c }: { c: CampaignRow }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(editCampaign, idle);
  const link = c.utmCampaign ? campaignLink(c.platform, c.utmCampaign) : null;

  if (editing) {
    return (
      <li className="rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
        <form action={action}>
          <input type="hidden" name="id" value={c.id} />
          <Fields c={c} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper disabled:opacity-50">
              {pending ? "Записва…" : "Запиши"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className={small}>Затвори</button>
            <Msg s={state} />
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-bh-ink/8 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-bh-ink/70">
              {platformLabel(c.platform)} · {kindLabel(c.kind)}
            </span>
            <span className="text-xs text-bh-ink/55">
              {c.postedAt.toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", timeZone: "Europe/Sofia" })} · {sofiaTime(c.postedAt)}
            </span>
            {c.spendCents > 0 && <span className="text-xs font-semibold text-bh-ink">{formatPrice(c.spendCents)} € платени</span>}
          </div>
          <div className="mt-1.5 font-medium text-bh-ink">
            {c.url ? <a href={c.url} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">{c.title}</a> : c.title}
          </div>
          {c.note && <div className="mt-0.5 text-xs text-bh-ink/55">{c.note}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {link && <Copy text={link} />}
          <button type="button" onClick={() => setEditing(true)} className={small}>Редактирай</button>
          <form
            action={removeCampaign}
            onSubmit={(e) => {
              if (!window.confirm(`Изтриваш „${c.title}“?`)) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={c.id} />
            <button type="submit" className="rounded-full px-3 py-1.5 text-xs font-semibold text-bh-ink/50 transition-colors hover:text-red-600">Изтрий</button>
          </form>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4 lg:grid-cols-7">
        <div>
          <dt className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bh-ink/45">Достигнати</dt>
          <dd className="mt-0.5 font-semibold text-bh-ink">{n(c.reach)}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bh-ink/45">Реакции</dt>
          <dd className="mt-0.5 font-semibold text-bh-ink">
            {n(c.likes)}
            {c.comments !== null || c.saves !== null ? (
              <span className="ml-1 text-xs font-normal text-bh-ink/55">· {n(c.comments)} ком. · {n(c.saves)} зап.</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bh-ink/45">Кликове (платф.)</dt>
          <dd className="mt-0.5 font-semibold text-bh-ink">{n(c.clicks)}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bh-ink/45">По линка</dt>
          <dd className="mt-0.5 font-semibold text-bh-ink">{c.utmCampaign ? `${c.taggedVisitors} души` : <span className="font-normal text-bh-ink/40">без код</span>}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bh-ink/45">Купили по линка</dt>
          <dd className="mt-0.5 font-semibold text-[#0b6d61]">
            {c.taggedTickets} {c.taggedTickets ? <span className="text-xs font-normal">· {formatPrice(c.taggedGrossCents)} €</span> : null}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bh-ink/45">От {platformLabel(c.platform)} · 48 ч</dt>
          <dd className="mt-0.5 font-semibold text-bh-ink">{c.windowVisitors} души</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bh-ink/45">Продадени · 48 ч</dt>
          <dd className="mt-0.5 font-semibold text-bh-ink">{c.windowTickets} <span className="text-xs font-normal text-bh-ink/55">от всички канали</span></dd>
        </div>
      </dl>
      {link && (
        <p className="mt-3 truncate font-mono text-[0.68rem] text-bh-ink/50" title={link}>{link}</p>
      )}
    </li>
  );
}
