"use client";

import { useActionState, useState } from "react";

import type { LogisticsRow } from "@/lib/speaker-logistics";

import { type FormState, saveRow } from "./actions";

const idle: FormState = { status: "idle" };
const field = "w-full min-w-0 rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";
const check = "h-3.5 w-3.5 accent-[#146455]";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bh-ink/50">{children}</span>;
}

/** One speaker's sheet: folded to a line of badges, opened to the form. */
export function LogisticsEditor({ r }: { r: LogisticsRow }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(saveRow, idle);
  const abroad = r.country && r.country !== "България";

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5 print:hidden">
        <Badge on={r.confirmed} label="потвърден" />
        <Badge on={!!r.presentationAt} label="презентация" />
        {abroad && <Badge on={r.hotelBooked} label="хотел" />}
        <Badge on={!!r.arrives} label="пристигане" />
        <Badge on={!!r.host} label="посрещач" />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-1 rounded-full border border-bh-ink/20 px-3 py-1 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink"
        >
          {open ? "Затвори" : "Редактирай"}
        </button>
      </div>

      {open && (
        <form action={action} className="mt-3 rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8 print:hidden">
          <input type="hidden" name="speakerId" value={r.speakerId} />
          <div className="flex flex-wrap gap-4 text-sm text-bh-ink/80">
            <label className="flex items-center gap-2"><input type="checkbox" name="confirmed" defaultChecked={r.confirmed} className={check} /> потвърди участие</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="presentation" defaultChecked={!!r.presentationAt} className={check} /> презентацията е получена</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="hotelBooked" defaultChecked={r.hotelBooked} className={check} /> хотелът е резервиран</label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div><Label>Имейл</Label><input name="email" type="email" defaultValue={r.email ?? ""} className={field} /></div>
            <div><Label>Телефон</Label><input name="phone" defaultValue={r.phone ?? ""} className={field} /></div>
            <div><Label>Пристига</Label><input name="arrives" defaultValue={r.arrives ?? ""} placeholder="06.11 14:30, полет W6 4321" className={field} /></div>
            <div><Label>Заминава</Label><input name="departs" defaultValue={r.departs ?? ""} placeholder="08.11 20:10" className={field} /></div>
            <div><Label>Хотел</Label><input name="hotel" defaultValue={r.hotel ?? ""} placeholder="Millennium, 2 нощувки, 06-08.11" className={field} /></div>
            <div><Label>Кой го посреща</Label><input name="host" defaultValue={r.host ?? ""} placeholder="име и телефон" className={field} /></div>
            <div><Label>Техника</Label><input name="tech" defaultValue={r.tech ?? ""} placeholder="кликер, HDMI, звук за видео" className={field} /></div>
            <div><Label>Храна</Label><input name="dietary" defaultValue={r.dietary ?? ""} placeholder="вегетарианец, без глутен" className={field} /></div>
          </div>
          <div className="mt-3"><Label>Бележки</Label><textarea name="notes" defaultValue={r.notes ?? ""} rows={2} className={field} /></div>
          <div className="mt-3 flex items-center gap-3">
            <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-5 py-2 text-sm font-semibold text-bh-paper disabled:opacity-50">
              {pending ? "…" : "Запиши"}
            </button>
            {state.status !== "idle" && (
              <span className={`text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{state.message}</span>
            )}
          </div>
        </form>
      )}
    </>
  );
}

function Badge({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide ${
        on ? "bg-[#146455]/12 text-[#146455]" : "bg-bh-ink/6 text-bh-ink/40 line-through decoration-bh-ink/30"
      }`}
    >
      {label}
    </span>
  );
}
