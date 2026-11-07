import Link from "next/link";

import { listWorkshopAttendees, type listWorkshops } from "@/lib/workshops";

import { markArrived, unmarkArrived } from "./actions";
import { StandScanner } from "./StandScanner";

export const DAYS = ["", "Събота 07.11", "Неделя 08.11"];
export const time = (d: Date) => d.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" });

/** 1 on the Saturday, 2 on the Sunday, else null: which day's sessions open first. */
export function todayDay(): number | null {
  const d = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(new Date());
  return d === "2026-11-07" ? 1 : d === "2026-11-08" ? 2 : null;
}

/** "HH:MM" now, in Sofia: the session running or coming next is marked. */
export function nowHHMM(): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Sofia", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
}

type Session = Awaited<ReturnType<typeof listWorkshops>>[number];

/**
 * One stand, every slot of the day with its names - for the people at the
 * stand (a masseur with a phone), who need the next names, not a list of
 * 24 sessions to open one by one. Today first, slots already over at the end.
 */
export async function StandPage({ location, title: only, list, back = true, sessionLinks = false }: { location: string; title?: string; list: Session[]; back?: boolean; sessionLinks?: boolean }) {
  const slots = list.filter((w) => w.active && w.location === location && (!only || w.title === only));
  const people = Object.fromEntries(
    await Promise.all(slots.map(async (w) => [w.id, w.booked > 0 ? await listWorkshopAttendees(w.id) : []] as const)),
  );
  const today = todayDay();
  const now = nowHHMM();
  const order = today === 2 ? [2, 1] : [1, 2];
  // One stand can run several procedures at the same hours (D4): then the page
  // is named by the stand and every slot says which procedure it is.
  const mixed = new Set(slots.map((w) => w.title)).size > 1;
  const title = mixed ? location : (slots[0]?.title ?? location);
  const booked = slots.reduce((n, w) => n + w.booked, 0);
  const places = slots.reduce((n, w) => n + w.capacity, 0);

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-lg">
        {back && <Link href="/admin/zala" className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50 hover:text-bh-ink">← Всички сесии</Link>}
        <h1 className="mt-2 font-display text-2xl font-[900] uppercase tracking-tight text-bh-ink">{title}</h1>
        <p className="mt-1 text-sm text-bh-ink/60">{location}, записани {booked} от {places} места</p>
        {slots.length > 0 && <StandScanner stand={location} title={only} />}
        {slots.length === 0 && <p className="mt-6 text-sm text-bh-ink/55">Няма часове на този щанд.</p>}
        {order.map((day) => {
          const forDay = slots.filter((w) => w.day === day);
          if (forDay.length === 0) return null;
          const current = today === day ? forDay.find((w) => w.endsAt > now) : undefined;
          return (
            <section key={day} className="mt-8">
              <h2 className="text-lg font-bold tracking-tight text-bh-ink">{DAYS[day]}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {forDay.map((w) => {
                  const over = today === day && w.endsAt <= now;
                  return (
                    <li key={w.id} className={`rounded-2xl bg-bh-cloud px-4 py-3 ring-1 ${current?.id === w.id ? "ring-bh-ink/50" : "ring-bh-ink/6"} ${over ? "opacity-50" : ""}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-bh-ink">{w.startsAt}-{w.endsAt}</span>
                          {mixed && <span className="text-sm font-semibold text-bh-ink">{w.title}</span>}
                          {current?.id === w.id && <span className="rounded-full bg-[#ACEC1D] px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-bh-ink">сега</span>}
                        </div>
                        <span className="flex items-center gap-3 text-xs text-bh-ink/55">
                          {w.booked} / {w.capacity}
                          {/* The door team opens the session for a walk-in ("Пусни без запис"). */}
                          {sessionLinks && <Link href={`/admin/zala?w=${w.id}`} className="font-semibold text-bh-ink underline">без запис</Link>}
                        </span>
                      </div>
                      {people[w.id].length === 0 ? (
                        <p className="mt-1 text-sm text-bh-ink/45">свободно</p>
                      ) : (
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {people[w.id].map((a) => (
                            <li key={a.code} className="flex items-center justify-between gap-3 text-sm">
                              <div className="min-w-0">
                                <span className={`font-medium ${a.checkedIn ? "text-bh-ink/50 line-through decoration-bh-ink/30" : "text-bh-ink"}`}>{a.name}</span>
                                <span className="ml-2 text-xs text-bh-ink/45">{a.code}</span>
                              </div>
                              {a.checkedIn ? (
                                <form action={unmarkArrived} className="shrink-0">
                                  <input type="hidden" name="workshopId" value={w.id} />
                                  <input type="hidden" name="code" value={a.code} />
                                  <button type="submit" className="text-[0.65rem] font-semibold uppercase tracking-wide text-bh-ink/45 hover:text-bh-ink">върни</button>
                                </form>
                              ) : (
                                <form action={markArrived} className="shrink-0">
                                  <input type="hidden" name="workshopId" value={w.id} />
                                  <input type="hidden" name="code" value={a.code} />
                                  <button type="submit" className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">Дойде</button>
                                </form>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
