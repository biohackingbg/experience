"use client";

import { useActionState, useState } from "react";

import { PAGES } from "@/lib/access-options";
import type { Grant } from "@/lib/access";

import { type GrantState, addGrant, editGrant, stopGrant } from "./actions";

const idle: GrantState = { status: "idle" };
const field = "w-full min-w-0 rounded-full border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";
const small = "rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink";

function Scopes({ checked }: { checked?: string[] }) {
  return (
    <fieldset className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
      <legend className="font-mono text-[0.62rem] uppercase tracking-[0.15em] text-bh-ink/55">Кои страници</legend>
      {PAGES.map((p) => (
        <label key={p.id} className="flex items-center gap-2 text-sm text-bh-ink">
          <input type="checkbox" name="scopes" value={p.id} defaultChecked={checked?.includes(p.id)} className="h-3.5 w-3.5 accent-[#146455]" />
          {p.label}
          {p.sensitive && <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-[#9c3d5c]">лични данни</span>}
        </label>
      ))}
    </fieldset>
  );
}

function CopyLink({ link }: { link: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="mt-3 rounded-2xl bg-[#cef870]/30 p-4 ring-1 ring-[#8fb832]/40">
      <p className="text-xs text-bh-ink/70">Линкът се показва само веднъж. Прати го на човека през сигурен канал, не в общ чат.</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded-xl bg-bh-paper px-3 py-2 font-mono text-xs text-bh-ink">{link}</code>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setDone(true);
            setTimeout(() => setDone(false), 2000);
          }}
          className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper"
        >
          {done ? "Копиран ✓" : "Копирай"}
        </button>
      </div>
    </div>
  );
}

export function NewGrantForm() {
  const [state, action, pending] = useActionState(addGrant, idle);
  return (
    <form action={action}>
      <div className="grid gap-2 sm:grid-cols-[1fr_11rem]">
        <input name="label" required placeholder="за кого е (напр. Агенция X)" className={field} />
        <input name="until" type="date" className={field} title="валиден до (по избор)" />
      </div>
      <Scopes checked={["reklama", "poseshteniya"]} />
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper disabled:opacity-50">
          {pending ? "Създава…" : "Създай линк за достъп"}
        </button>
        {state.status === "error" && <span className="text-xs text-red-600">{state.message}</span>}
      </div>
      {state.status === "ok" && state.link && (
        <>
          <p className="mt-3 text-sm text-bh-pine">{state.message}</p>
          <CopyLink link={state.link} />
        </>
      )}
    </form>
  );
}

export function GrantRow({ g }: { g: Grant }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(editGrant, idle);
  const dead = g.dead;
  const d = (x: Date | null) => (x ? x.toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Sofia" }) : null);
  return (
    <li className={`py-4 ${dead ? "opacity-55" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-bh-ink">
            {g.label}
            <span className={`ml-2 rounded-full px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide ${dead ? "bg-bh-ink/10 text-bh-ink/55" : "bg-[#0E8C7D]/15 text-[#0b6d61]"}`}>
              {g.revokedAt ? "спрян" : dead ? "изтекъл" : "активен"}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-bh-ink/60">
            {g.scopes.map((s) => PAGES.find((p) => p.id === s)?.label ?? s).join(" · ")}
          </div>
          <div className="mt-0.5 text-xs text-bh-ink/50">
            {g.expiresAt ? `до ${d(g.expiresAt)}` : "без срок"} · {g.lastUsedAt ? `последно отварян ${d(g.lastUsedAt)}` : "още не е отварян"} · създаден {d(g.createdAt)}
          </div>
        </div>
        {!dead && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setOpen((v) => !v)} className={small}>{open ? "Затвори" : "Промени"}</button>
            <form
              action={stopGrant}
              onSubmit={(e) => {
                if (!window.confirm(`Спираш достъпа на ${g.label}? Линкът спира да работи веднага.`)) e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={g.id} />
              <button type="submit" className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink/70 transition-colors hover:border-red-600 hover:text-red-600">Спри</button>
            </form>
          </div>
        )}
      </div>
      {open && !dead && (
        <form action={action} className="mt-3 rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
          <input type="hidden" name="id" value={g.id} />
          <label className="block text-xs text-bh-ink/60">
            валиден до (празно = без срок)
            <input name="until" type="date" defaultValue={g.expiresAt ? g.expiresAt.toISOString().slice(0, 10) : ""} className={`${field} mt-1 sm:w-48`} />
          </label>
          <Scopes checked={g.scopes} />
          <div className="mt-3 flex items-center gap-2">
            <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper disabled:opacity-50">
              {pending ? "Записва…" : "Запиши"}
            </button>
            {state.status !== "idle" && <span className={`text-xs ${state.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{state.message}</span>}
          </div>
        </form>
      )}
    </li>
  );
}
