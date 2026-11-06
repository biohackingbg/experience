import type { Metadata } from "next";
import Link from "next/link";

import { HomeLink } from "@/components/admin/HomeLink";
import { PrintButton } from "@/components/admin/PrintButton";
import { requireAccess } from "@/lib/access";
import { kindLabel } from "@/lib/workshop-options";
import { listWorkshopAttendees, listWorkshops } from "@/lib/workshops";

import { markArrived, unmarkArrived } from "./actions";
import { RoomScanner } from "./RoomScanner";

export const metadata: Metadata = {
  title: "Зала | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const DAYS = ["", "Събота 07.11", "Неделя 08.11"];
const time = (d: Date) => d.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" });

/** 1 on the Saturday, 2 on the Sunday, else null: which day's sessions open first. */
function todayDay(): number | null {
  const d = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(new Date());
  return d === "2026-11-07" ? 1 : d === "2026-11-08" ? 2 : null;
}

/** "HH:MM" now, in Sofia: the session running or coming next is marked. */
function nowHHMM(): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Sofia", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
}

/**
 * The door of a workshop or experience room. One phone per door: pick the
 * session, then scan or tap names. Everyone sees the same list, so the
 * second phone at the same door shows who the first one let in.
 */
export default async function RoomPage({ searchParams }: { searchParams: Promise<{ w?: string; shtand?: string }> }) {
  await requireAccess("zala");
  const { w: chosenId = "", shtand = "" } = await searchParams;
  const list = await listWorkshops(true);
  const chosen = list.find((w) => w.id === chosenId);

  if (!chosen && shtand) return <StandPage location={shtand} list={list} />;

  if (!chosen) {
    // A stand with short slots (a massage every 15 minutes) is one page with every name on it.
    const stands = [...new Set(list.filter((w) => w.active && w.location?.startsWith("Щанд")).map((w) => w.location as string))].sort();
    const today = todayDay();
    const now = nowHHMM();
    const counts = Object.fromEntries(
      await Promise.all(list.map(async (w) => [w.id, w.booked > 0 ? (await listWorkshopAttendees(w.id)).filter((a) => a.checkedIn).length : 0] as const)),
    );
    const order = today === 2 ? [2, 1] : [1, 2];
    return (
      <div className="px-5 py-8 sm:px-8">
        <div className="mx-auto w-full max-w-2xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Проверка</p>
              <h1 className="mt-2 font-display text-3xl font-[900] uppercase tracking-tight text-bh-ink">Зала</h1>
            </div>
            <HomeLink />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-bh-ink/60">
            Избери сесията пред чиято врата стоиш. После сканираш билета или отбелязваш по име. Човек без запис
            може да бъде пуснат, ако има свободно място.
          </p>
          {stands.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {stands.map((s) => (
                <Link
                  key={s}
                  href={`/admin/zala?shtand=${encodeURIComponent(s)}`}
                  className="rounded-full bg-bh-ink px-4 py-2 text-sm font-semibold text-bh-paper hover:bg-bh-ink/85"
                >
                  {s}: всички часове с имената
                </Link>
              ))}
            </div>
          )}
          {order.map((day) => {
            const forDay = list.filter((w) => w.day === day && w.active);
            if (forDay.length === 0) return null;
            const current = today === day ? forDay.find((w) => w.endsAt > now) : undefined;
            return (
              <section key={day} className="mt-8">
                <h2 className="text-lg font-bold tracking-tight text-bh-ink">{DAYS[day]}</h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {forDay.map((w) => (
                    <li key={w.id}>
                      <Link
                        href={`/admin/zala?w=${w.id}`}
                        className={`flex items-center justify-between gap-3 rounded-2xl bg-bh-cloud px-4 py-3.5 ring-1 transition-colors hover:ring-bh-ink/40 ${current?.id === w.id ? "ring-bh-ink/50" : "ring-bh-ink/6"}`}
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-bh-ink/60">{w.startsAt}-{w.endsAt}</span>
                            <span className="rounded-full bg-bh-ink/8 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-bh-ink/70">{kindLabel(w.kind)}</span>
                            {current?.id === w.id && <span className="rounded-full bg-[#ACEC1D] px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-bh-ink">сега</span>}
                          </div>
                          <div className="mt-1 font-semibold text-bh-ink">{w.title}</div>
                          <div className="truncate text-xs text-bh-ink/60">{[w.host, w.location].filter(Boolean).join(", ")}</div>
                        </div>
                        <div className="shrink-0 text-right text-sm">
                          <div className="font-semibold text-bh-ink">{counts[w.id]} / {w.booked}</div>
                          <div className="text-[0.65rem] uppercase tracking-wide text-bh-ink/50">дошли / записани</div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  const attendees = await listWorkshopAttendees(chosen.id);
  const arrived = attendees.filter((a) => a.checkedIn).length;

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href="/admin/zala" className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50 hover:text-bh-ink">← Всички сесии</Link>
            <h1 className="mt-2 font-display text-2xl font-[900] uppercase tracking-tight text-bh-ink">{chosen.title}</h1>
            <p className="mt-1 text-sm text-bh-ink/60">
              {DAYS[chosen.day]}, {chosen.startsAt}-{chosen.endsAt}
              {chosen.location ? `, ${chosen.location}` : ""}
              {chosen.host ? `, ${chosen.host}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 gap-2 print:hidden">
            <PrintButton label="Печат" />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 print:hidden">
          {[
            [arrived, "дошли"],
            [chosen.booked, "записани"],
            [chosen.left, "свободни"],
          ].map(([n, label]) => (
            <div key={label} className="rounded-2xl bg-bh-cloud px-4 py-4 ring-1 ring-bh-ink/8">
              <div className="text-2xl font-black tracking-tight text-bh-ink">{n}</div>
              <div className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.15em] text-bh-ink/50">{label}</div>
            </div>
          ))}
        </div>

        <div className="print:hidden">
          <RoomScanner workshopId={chosen.id} />
        </div>

        <section className="mt-10">
          <h2 className="text-sm font-bold tracking-tight text-bh-ink">Записани ({attendees.length})</h2>
          {attendees.length === 0 ? (
            <p className="mt-3 text-sm text-bh-ink/55">Още никой не се е записал.</p>
          ) : (
            <ul className="mt-3 divide-y divide-bh-ink/8 rounded-2xl bg-bh-cloud ring-1 ring-bh-ink/8">
              {attendees.map((a, i) => (
                <li key={a.code} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="w-5 shrink-0 text-right text-xs text-bh-ink/40">{i + 1}.</span>
                    <div className="min-w-0">
                      <div className={`font-medium ${a.checkedIn ? "text-bh-ink/50 line-through decoration-bh-ink/30" : "text-bh-ink"}`}>{a.name}</div>
                      <div className="truncate text-xs text-bh-ink/55">{a.tierName} · {a.code}</div>
                    </div>
                  </div>
                  {a.checkedIn ? (
                    <form action={unmarkArrived} className="flex shrink-0 items-center gap-2">
                      <input type="hidden" name="workshopId" value={chosen.id} />
                      <input type="hidden" name="code" value={a.code} />
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-900">
                        дошъл {a.checkedInAt ? time(a.checkedInAt) : ""}
                      </span>
                      <button type="submit" className="text-[0.65rem] font-semibold uppercase tracking-wide text-bh-ink/45 hover:text-bh-ink print:hidden" title="Отбелязан по грешка">
                        върни
                      </button>
                    </form>
                  ) : (
                    <form action={markArrived} className="print:hidden">
                      <input type="hidden" name="workshopId" value={chosen.id} />
                      <input type="hidden" name="code" value={a.code} />
                      <button type="submit" className="shrink-0 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white">
                        Дойде
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

type Session = Awaited<ReturnType<typeof listWorkshops>>[number];

/**
 * One stand, every slot of the day with its names - for the people at the
 * stand (a masseur with a phone), who need the next names, not a list of
 * 24 sessions to open one by one. Today first, slots already over at the end.
 */
async function StandPage({ location, list }: { location: string; list: Session[] }) {
  const slots = list.filter((w) => w.active && w.location === location);
  const people = Object.fromEntries(
    await Promise.all(slots.map(async (w) => [w.id, w.booked > 0 ? await listWorkshopAttendees(w.id) : []] as const)),
  );
  const today = todayDay();
  const now = nowHHMM();
  const order = today === 2 ? [2, 1] : [1, 2];
  const title = slots[0]?.title ?? location;
  const booked = slots.reduce((n, w) => n + w.booked, 0);
  const places = slots.reduce((n, w) => n + w.capacity, 0);

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/admin/zala" className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50 hover:text-bh-ink">← Всички сесии</Link>
        <h1 className="mt-2 font-display text-2xl font-[900] uppercase tracking-tight text-bh-ink">{title}</h1>
        <p className="mt-1 text-sm text-bh-ink/60">{location}, записани {booked} от {places} места</p>
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
                          {current?.id === w.id && <span className="rounded-full bg-[#ACEC1D] px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-bh-ink">сега</span>}
                        </div>
                        <span className="text-xs text-bh-ink/55">{w.booked} / {w.capacity}</span>
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
