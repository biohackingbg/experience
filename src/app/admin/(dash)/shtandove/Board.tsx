"use client";

import { useActionState, useState } from "react";

import { type BoardBooth, type BoardPartner, type BoothStatus, PLAN_ASPECT, PLAN_IMAGE, STATUS, ZONES, zoneOf } from "@/lib/booths-plan";
import { MONEY, TIERS } from "@/lib/finance-options";

import { type FormState, freeBooth, saveBooth } from "./actions";

const idle: FormState = { status: "idle" };
const field = "w-full rounded-full border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink placeholder:text-bh-ink/35";

const tierLabel = (id: string | null) => TIERS.find((t) => t.id === id)?.label ?? null;
const moneyLabel = (id: string | null) => MONEY.find((m) => m.id === id)?.label ?? null;

/** What a module shows on the plan: the partner, or who is holding it. */
function shortName(b: BoardBooth): string | null {
  if (b.partner) return b.partner.label;
  if (b.holdLabel) return b.holdLabel;
  return null;
}

/**
 * The plan with the current state laid over it, and a panel for the module
 * that was clicked. The image already carries the zone colours and the
 * module ids; the overlay only says who is on each one, so an empty
 * module looks exactly as the architect drew it.
 */
export function Board({ booths, partners }: { booths: BoardBooth[]; partners: BoardPartner[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = booths.find((b) => b.id === selectedId) ?? null;
  const unplaced = partners.filter((p) => p.booths.length === 0 && (p.stage === "confirmed" || p.money));

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="rounded-3xl bg-bh-cloud p-3 ring-1 ring-bh-ink/6 sm:p-4">
        <div className="relative w-full overflow-hidden rounded-2xl bg-white" style={{ aspectRatio: String(PLAN_ASPECT) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={PLAN_IMAGE} alt="План на изложбената зона" className="absolute inset-0 h-full w-full select-none" draggable={false} />
          {booths.map((b) => {
            const [l, t, w, h] = b.box;
            const name = shortName(b);
            const active = b.id === selectedId;
            const tall = h > w;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedId(active ? null : b.id)}
                title={`${b.id} · ${STATUS[b.status].label}${name ? ` · ${name}` : ""}`}
                aria-pressed={active}
                className={`absolute flex items-center justify-center overflow-hidden rounded-[6px] text-center leading-none transition-all ${
                  active ? "z-10 ring-[3px] ring-[#0b2a22] ring-offset-2 ring-offset-white" : "hover:ring-2 hover:ring-[#0b2a22]/60"
                }`}
                style={{
                  left: `${l}%`,
                  top: `${t}%`,
                  width: `${w}%`,
                  height: `${h}%`,
                  background: b.status === "free" ? "transparent" : STATUS[b.status].colour,
                  opacity: b.status === "free" ? 1 : 0.94,
                }}
              >
                {name && (
                  <span
                    className="px-0.5 text-[0.55rem] font-semibold text-white sm:text-[0.62rem]"
                    style={tall ? { writingMode: "vertical-rl", transform: "rotate(180deg)" } : undefined}
                  >
                    {name.length > 14 ? `${name.slice(0, 13)}…` : name}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <Legend />
      </div>

      <aside className="flex flex-col gap-4">
        <div className="rounded-3xl bg-bh-cloud p-5 ring-1 ring-bh-ink/6">
          {selected ? (
            <BoothPanel key={`${selected.id}:${selected.partner?.id ?? ""}:${selected.holdLabel ?? ""}`} booth={selected} partners={partners} onClose={() => setSelectedId(null)} />
          ) : (
            <>
              <h2 className="text-lg font-bold tracking-tight text-bh-ink">Избери щанд</h2>
              <p className="mt-2 text-sm leading-relaxed text-bh-ink/60">
                Натисни модул от плана. Ще видиш кой е на него и ще можеш да сложиш партньор, да го запазиш
                за някого извън списъка или да го освободиш.
              </p>
            </>
          )}
        </div>

        {unplaced.length > 0 && (
          <div className="rounded-3xl bg-bh-cloud p-5 ring-1 ring-bh-ink/6">
            <h3 className="text-sm font-bold tracking-tight text-bh-ink">Партньори без щанд</h3>
            <p className="mt-1 text-xs text-bh-ink/55">договорени или с пакет, но още без място</p>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm">
              {unplaced.map((p) => (
                <li key={p.id} className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-bh-ink">{p.label}</span>
                  <span className="shrink-0 text-xs text-bh-ink/50">
                    {[tierLabel(p.tier), moneyLabel(p.money)].filter(Boolean).join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-xs text-bh-ink/65">
      {(Object.keys(STATUS) as BoothStatus[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-4 rounded-[3px] ring-1 ring-inset ring-bh-ink/25"
            style={{ background: s === "free" ? "white" : STATUS[s].colour }}
          />
          {STATUS[s].label}
        </span>
      ))}
      <span className="ml-auto inline-flex flex-wrap gap-x-3">
        {ZONES.map((z) => (
          <span key={z.id} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: z.colour }} />
            {z.id} {z.label}
          </span>
        ))}
      </span>
    </div>
  );
}

function BoothPanel({ booth, partners, onClose }: { booth: BoardBooth; partners: BoardPartner[]; onClose: () => void }) {
  const [state, action, pending] = useActionState(saveBooth, idle);
  const [freeState, freeAction, freeing] = useActionState(freeBooth, idle);
  const [partnerId, setPartnerId] = useState(booth.partner?.id ?? "");
  const zone = zoneOf(booth.id);
  const msg = state.status !== "idle" ? state : freeState.status !== "idle" ? freeState : null;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-bh-ink">Щанд {booth.id}</h2>
          <p className="mt-0.5 text-xs text-bh-ink/55">
            {zone ? `${zone.id} · ${zone.label} · ${zone.hint}` : ""} · 3 × 2 m
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full px-2 py-1 text-sm text-bh-ink/50 hover:bg-bh-ink/5" aria-label="Затвори">
          ✕
        </button>
      </div>

      <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-bh-paper px-3 py-1 text-xs font-semibold text-bh-ink ring-1 ring-bh-ink/10">
        <span className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-bh-ink/25" style={{ background: booth.status === "free" ? "white" : STATUS[booth.status].colour }} />
        {STATUS[booth.status].label}
        {booth.partner && (
          <span className="font-normal text-bh-ink/60">
            · {booth.partner.label}
            {booth.partner.money ? ` (${moneyLabel(booth.partner.money)})` : ""}
          </span>
        )}
      </p>
      {booth.partner && booth.partner.money !== "paid" && (
        <p className="mt-2 text-xs leading-relaxed text-bh-ink/55">
          „Платен“ става сам, когато в Подготовка парите на този партньор се отбележат като платени.
        </p>
      )}

      <form action={action} className="mt-4 flex flex-col gap-2">
        <input type="hidden" name="booth" value={booth.id} />
        <label className="text-xs font-semibold text-bh-ink/70">Партньор</label>
        <select name="partner" value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className={field}>
          <option value="">— без партньор —</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
              {p.tier ? ` · ${tierLabel(p.tier)}` : ""}
              {p.money ? ` · ${moneyLabel(p.money)}` : ""}
              {p.booths.length ? ` · вече на ${p.booths.join(", ")}` : ""}
            </option>
          ))}
        </select>
        {!partnerId && (
          <>
            <label className="text-xs font-semibold text-bh-ink/70">Или запази за</label>
            <input name="hold" defaultValue={booth.holdLabel ?? ""} placeholder="Организатор, медии, Biohacking.bg…" className={field} />
          </>
        )}
        <label className="text-xs font-semibold text-bh-ink/70">Бележка</label>
        <input name="note" defaultValue={booth.note ?? ""} maxLength={300} placeholder="ток, екран, двоен модул…" className={field} />
        <div className="mt-1 flex items-center gap-2">
          <button type="submit" disabled={pending} className="rounded-full bg-bh-ink px-4 py-2 text-sm font-semibold text-bh-paper disabled:opacity-50">
            {pending ? "Записва…" : "Запази"}
          </button>
          {msg && <span className={`text-xs ${msg.status === "ok" ? "text-bh-pine" : "text-red-600"}`}>{msg.message}</span>}
        </div>
      </form>
      {booth.status !== "free" && (
        <form action={freeAction} className="mt-3">
          <input type="hidden" name="booth" value={booth.id} />
          <button type="submit" disabled={freeing} className="text-xs font-semibold text-red-700 underline-offset-2 hover:underline disabled:opacity-50">
            {freeing ? "Освобождава…" : `Освободи ${booth.id}`}
          </button>
        </form>
      )}
    </div>
  );
}
