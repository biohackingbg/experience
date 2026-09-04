"use client";

import { useActionState, useState } from "react";

import type { Shift } from "@/lib/shifts";
import { DAYS, ZONES } from "@/lib/shifts-options";

import { type FormState, createShift, editShift, removeShift } from "./actions";

const idle: FormState = { status: "idle" };
const field = "w-full min-w-0 rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";
const small = "rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink";

function Msg({ s }: { s: FormState }) {
  if (s.status === "idle") return null;
  return <span className={`text-xs ${s.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{s.message}</span>;
}

function Fields({ s, day }: { s?: Shift; day?: number }) {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-[10rem_1fr_6rem_6rem]">
        <select name="day" defaultValue={String(s?.day ?? day ?? 1)} className={field}>
          <option value="1">{DAYS[1]}</option>
          <option value="2">{DAYS[2]}</option>
        </select>
        <input name="zone" list="zones" defaultValue={s?.zone ?? ""} required placeholder="зона" className={field} />
        <input name="startsAt" type="time" defaultValue={s?.startsAt ?? "09:00"} required className={field} />
        <input name="endsAt" type="time" defaultValue={s?.endsAt ?? "13:00"} required className={field} />
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_10rem_1fr]">
        <input name="person" defaultValue={s?.person ?? ""} required placeholder="кой" className={field} />
        <input name="phone" defaultValue={s?.phone ?? ""} placeholder="телефон" className={field} />
        <input name="note" defaultValue={s?.note ?? ""} placeholder="бележка (радио 3, ключ от склада…)" className={field} />
      </div>
      <datalist id="zones">
        {ZONES.map((z) => <option key={z} value={z} />)}
      </datalist>
    </>
  );
}

export function NewShiftForm({ day }: { day?: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createShift, idle);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper">+ Нова смяна</button>;
  return (
    <form action={action} className="w-full rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
      <Fields day={day} />
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-5 py-2 text-sm font-semibold text-bh-paper disabled:opacity-50">{pending ? "…" : "Добави"}</button>
        <button type="button" onClick={() => setOpen(false)} className={small}>Затвори</button>
        <Msg s={state} />
      </div>
    </form>
  );
}

export function ShiftEditor({ s }: { s: Shift }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(editShift, idle);
  if (!open) {
    return (
      <div className="flex items-center gap-2 print:hidden">
        <button type="button" onClick={() => setOpen(true)} className={small}>Редактирай</button>
        <form action={removeShift} onSubmit={(e) => { if (!window.confirm(`Махаш ${s.person} от ${s.zone}?`)) e.preventDefault(); }}>
          <input type="hidden" name="id" value={s.id} />
          <button type="submit" className="rounded-full px-2 py-1.5 text-xs font-semibold text-[#9c3d5c] hover:underline">Махни</button>
        </form>
      </div>
    );
  }
  return (
    <form action={action} className="mt-2 w-full rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8 print:hidden">
      <input type="hidden" name="id" value={s.id} />
      <Fields s={s} />
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-5 py-2 text-sm font-semibold text-bh-paper disabled:opacity-50">{pending ? "…" : "Запиши"}</button>
        <button type="button" onClick={() => setOpen(false)} className={small}>Затвори</button>
        <Msg s={state} />
      </div>
    </form>
  );
}
