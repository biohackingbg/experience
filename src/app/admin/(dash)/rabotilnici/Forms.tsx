"use client";

import { useActionState, useState } from "react";

import { KINDS } from "@/lib/workshop-options";
import type { Workshop } from "@/lib/workshops";

import { type FormState, createWorkshop, editWorkshop, removeWorkshop } from "./actions";

const idle: FormState = { status: "idle" };
const field = "w-full min-w-0 rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";
const small = "rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink";

function Msg({ s }: { s: FormState }) {
  if (s.status === "idle") return null;
  return <span className={`text-xs ${s.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{s.message}</span>;
}

function Fields({ w }: { w?: Workshop }) {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-[12rem_1fr]">
        <select name="kind" defaultValue={w?.kind ?? "workshop"} className={field}>
          {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
        <input name="title" defaultValue={w?.title ?? ""} required placeholder="заглавие" className={field} />
      </div>
      <textarea name="description" defaultValue={w?.description ?? ""} rows={2} placeholder="за какво е (вижда се от купувача)" className={`${field} mt-2`} />
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input name="host" defaultValue={w?.host ?? ""} placeholder="кой я води" className={field} />
        <input name="location" defaultValue={w?.location ?? ""} placeholder="зала / зона" className={field} />
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-4">
        <select name="day" defaultValue={String(w?.day ?? 1)} className={field}>
          <option value="1">Събота 07.11</option>
          <option value="2">Неделя 08.11</option>
        </select>
        <input name="startsAt" type="time" defaultValue={w?.startsAt ?? "11:00"} required className={field} />
        <input name="endsAt" type="time" defaultValue={w?.endsAt ?? "12:00"} required className={field} />
        <input name="capacity" type="number" min={1} max={2000} defaultValue={w?.capacity ?? 20} required className={field} title="места" />
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs text-bh-ink/70">
        <input type="checkbox" name="active" defaultChecked={w?.active ?? true} className="h-3.5 w-3.5 accent-[#146455]" />
        отворена за записване
      </label>
    </>
  );
}

export function NewWorkshopForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createWorkshop, idle);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper">+ Нова</button>;
  return (
    <form action={action} className="rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
      <Fields />
      <div className="mt-3 flex items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper disabled:opacity-50">{pending ? "Записва…" : "Добави"}</button>
        <button type="button" onClick={() => setOpen(false)} className={small}>Затвори</button>
        <Msg s={state} />
      </div>
    </form>
  );
}

export function WorkshopEditor({ w }: { w: Workshop }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(editWorkshop, idle);
  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpen(true)} className={small}>Редактирай</button>
        {w.booked === 0 && (
          <form action={removeWorkshop} onSubmit={(e) => { if (!window.confirm(`Изтриваш „${w.title}“?`)) e.preventDefault(); }}>
            <input type="hidden" name="id" value={w.id} />
            <button type="submit" className="rounded-full px-2 py-1.5 text-xs text-bh-ink/45 hover:text-red-600">Изтрий</button>
          </form>
        )}
      </div>
    );
  }
  return (
    <form action={action} className="mt-2 w-full rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
      <input type="hidden" name="id" value={w.id} />
      <Fields w={w} />
      <div className="mt-3 flex items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper disabled:opacity-50">{pending ? "Записва…" : "Запиши"}</button>
        <button type="button" onClick={() => setOpen(false)} className={small}>Затвори</button>
        <Msg s={state} />
      </div>
    </form>
  );
}
