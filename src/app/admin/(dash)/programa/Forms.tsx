"use client";

import { useActionState, useState } from "react";

import type { SessionRow } from "@/lib/program-data";

import { type FormState, createSession, editSession, removeSession } from "./actions";

const idle: FormState = { status: "idle" };
const field = "w-full min-w-0 rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";
const small = "rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink";

function Msg({ s }: { s: FormState }) {
  if (s.status === "idle") return null;
  return <span className={`text-xs ${s.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{s.message}</span>;
}

function Fields({ day, s }: { day: number; s?: SessionRow }) {
  return (
    <>
      <input type="hidden" name="day" value={day} />
      <div className="grid gap-2 sm:grid-cols-[9rem_1fr]">
        <input name="time" defaultValue={s?.time ?? ""} required placeholder="10:25-11:20" className={field} />
        <input name="title" defaultValue={s?.title ?? ""} required placeholder="заглавие на сесията" className={field} />
      </div>
      <textarea name="note" defaultValue={s?.note ?? ""} rows={2} placeholder="за какво е (по избор)" className={`${field} mt-2`} />
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <input name="role" defaultValue={s?.role ?? ""} placeholder="напр. Модератор: Диана Радева" className={field} />
        <textarea name="people" defaultValue={s?.people ?? ""} rows={2} placeholder={"участници, по един на ред"} className={field} />
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs text-bh-ink/70">
        <input type="checkbox" name="pause" defaultChecked={s?.pause} className="h-3.5 w-3.5 accent-[#146455]" />
        пауза (регистрация, кафе, обяд) - показва се по-тихо
      </label>
    </>
  );
}

export function NewSessionForm({ day }: { day: number }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createSession, idle);
  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className={small}>+ Добави сесия</button>;
  }
  return (
    <form action={action} className="rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
      <Fields day={day} />
      <div className="mt-3 flex items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper disabled:opacity-50">
          {pending ? "Записва…" : "Добави"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={small}>Затвори</button>
        <Msg s={state} />
      </div>
    </form>
  );
}

export function SessionEditor({ s }: { s: SessionRow }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(editSession, idle);
  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpen(true)} className={small}>Редактирай</button>
        <form
          action={removeSession}
          onSubmit={(e) => {
            if (!window.confirm(`Изтриваш „${s.title}“?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={s.id} />
          <button type="submit" className="rounded-full px-2 py-1.5 text-xs text-bh-ink/45 hover:text-red-600">Изтрий</button>
        </form>
      </div>
    );
  }
  return (
    <form action={action} className="mt-2 w-full rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
      <input type="hidden" name="id" value={s.id} />
      <Fields day={s.day} s={s} />
      <div className="mt-3 flex items-center gap-2">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper disabled:opacity-50">
          {pending ? "Записва…" : "Запиши"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={small}>Затвори</button>
        <Msg s={state} />
      </div>
    </form>
  );
}
