"use client";

import { useActionState, useState } from "react";

import { type FormState, createOffer, editOffer, removeOffer, toggleOffer } from "./actions";

const idle: FormState = { status: "idle" };
const field = "w-full min-w-0 rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";
const small = "rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink";

/** What the form needs of an offer; dates already as YYYY-MM-DD in Sofia. */
export type OfferRow = {
  id: string;
  partner: string;
  partnerId: string | null;
  title: string;
  titleEn: string | null;
  body: string | null;
  bodyEn: string | null;
  how: string | null;
  howEn: string | null;
  code: string | null;
  url: string | null;
  tiers: string[];
  place: string;
  from: string;
  to: string;
  active: boolean;
  sort: number;
};
export type PartnerOption = { id: string; name: string; listed: boolean };
export type TierOption = { id: string; name: string };

function Msg({ s }: { s: FormState }) {
  if (s.status === "idle") return null;
  return <span className={`text-xs ${s.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{s.message}</span>;
}

function Fields({ o, partners, tiers }: { o?: OfferRow; partners: PartnerOption[]; tiers: TierOption[] }) {
  const [picked, setPicked] = useState(o?.partnerId ?? (o ? "" : (partners[0]?.id ?? "")));
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-bh-ink/60">
          Партньор
          <select name="partnerId" value={picked} onChange={(e) => setPicked(e.target.value)} className={`${field} mt-1 font-normal`}>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.name}{p.listed ? "" : " (профилът е скрит)"}</option>
            ))}
            <option value="">- друг, без профил -</option>
          </select>
        </label>
        {picked === "" && (
          <label className="block text-xs font-semibold text-bh-ink/60">
            Име на партньора
            <input name="partner" defaultValue={o?.partnerId ? "" : (o?.partner ?? "")} placeholder="както да се вижда" className={`${field} mt-1 font-normal`} />
          </label>
        )}
      </div>
      <input name="title" defaultValue={o?.title ?? ""} required placeholder="какво получава човек: -20% на всички добавки" className={`${field} mt-2`} />
      <textarea name="body" defaultValue={o?.body ?? ""} rows={2} placeholder="подробности (по избор)" className={`${field} mt-2`} />
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input name="how" defaultValue={o?.how ?? ""} placeholder="как се ползва: покажи билета на щанд A4" className={field} />
        <input name="code" defaultValue={o?.code ?? ""} placeholder="код за отстъпка (по избор)" className={`${field} font-mono`} />
      </div>
      <input name="url" defaultValue={o?.url ?? ""} placeholder="линк към магазина (по избор)" className={`${field} mt-2`} />
      <div className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr]">
        <fieldset className="flex flex-wrap items-center gap-3 text-xs text-bh-ink/70">
          <legend className="mb-1 font-semibold text-bh-ink/60">Къде</legend>
          <label className="flex items-center gap-1.5"><input type="radio" name="place" value="onsite" defaultChecked={(o?.place ?? "onsite") === "onsite"} className="accent-[#146455]" /> на място</label>
          <label className="flex items-center gap-1.5"><input type="radio" name="place" value="online" defaultChecked={o?.place === "online"} className="accent-[#146455]" /> онлайн</label>
        </fieldset>
        <fieldset className="flex flex-wrap items-center gap-3 text-xs text-bh-ink/70">
          <legend className="mb-1 font-semibold text-bh-ink/60">За кои билети (нищо отметнато = за всички)</legend>
          {tiers.map((t) => (
            <label key={t.id} className="flex items-center gap-1.5">
              <input type="checkbox" name="tiers" value={t.id} defaultChecked={o?.tiers.includes(t.id) ?? false} className="accent-[#146455]" /> {t.name}
            </label>
          ))}
        </fieldset>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_6rem]">
        <label className="block text-xs font-semibold text-bh-ink/60">
          Важи от (по избор)
          <input name="validFrom" type="date" defaultValue={o?.from ?? ""} className={`${field} mt-1 font-normal`} />
        </label>
        <label className="block text-xs font-semibold text-bh-ink/60">
          Важи до (включително)
          <input name="validTo" type="date" defaultValue={o?.to ?? ""} className={`${field} mt-1 font-normal`} />
        </label>
        <label className="block text-xs font-semibold text-bh-ink/60">
          Ред
          <input name="sort" type="number" defaultValue={o?.sort ?? 0} title="по-малкото е по-горе" className={`${field} mt-1 font-normal`} />
        </label>
      </div>
      <details className="mt-2" open={!!(o?.titleEn || o?.bodyEn || o?.howEn)}>
        <summary className="cursor-pointer text-xs font-semibold text-bh-ink/60">На английски (по избор)</summary>
        <input name="titleEn" defaultValue={o?.titleEn ?? ""} placeholder="what people get" className={`${field} mt-2`} />
        <textarea name="bodyEn" defaultValue={o?.bodyEn ?? ""} rows={2} placeholder="details" className={`${field} mt-2`} />
        <input name="howEn" defaultValue={o?.howEn ?? ""} placeholder="how to claim it" className={`${field} mt-2`} />
      </details>
      <label className="mt-3 flex items-center gap-2 text-xs text-bh-ink/70">
        <input type="checkbox" name="active" defaultChecked={o?.active ?? true} className="h-3.5 w-3.5 accent-[#146455]" />
        видима в приложението
      </label>
    </>
  );
}

export function NewOfferForm({ partners, tiers }: { partners: PartnerOption[]; tiers: TierOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createOffer, idle);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper">+ Нова оферта</button>;
  return (
    <form action={action} className="w-full rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8 sm:w-[38rem]">
      <Fields partners={partners} tiers={tiers} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper disabled:opacity-50">{pending ? "Записва…" : "Добави"}</button>
        <button type="button" onClick={() => setOpen(false)} className={small}>Затвори</button>
        <Msg s={state} />
      </div>
    </form>
  );
}

export function OfferEditor({ o, partners, tiers }: { o: OfferRow; partners: PartnerOption[]; tiers: TierOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(editOffer, idle);
  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <form action={toggleOffer}>
          <input type="hidden" name="id" value={o.id} />
          <input type="hidden" name="active" value={o.active ? "0" : "1"} />
          <button type="submit" className={small}>{o.active ? "Скрий" : "Покажи"}</button>
        </form>
        <button type="button" onClick={() => setOpen(true)} className={small}>Редактирай</button>
        <form action={removeOffer} onSubmit={(e) => { if (!window.confirm(`Изтриваш „${o.title}“?`)) e.preventDefault(); }}>
          <input type="hidden" name="id" value={o.id} />
          <button type="submit" className="rounded-full px-2 py-1.5 text-xs text-bh-ink/45 hover:text-red-600">Изтрий</button>
        </form>
      </div>
    );
  }
  return (
    <form action={action} className="mt-3 w-full rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
      <input type="hidden" name="id" value={o.id} />
      <Fields o={o} partners={partners} tiers={tiers} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper disabled:opacity-50">{pending ? "Записва…" : "Запиши"}</button>
        <button type="button" onClick={() => setOpen(false)} className={small}>Затвори</button>
        <Msg s={state} />
      </div>
    </form>
  );
}
