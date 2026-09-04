"use client";

import { useActionState } from "react";

import { BOOKING, type Lang } from "@/lib/i18n";
import { type WorkshopKind, kindLabel } from "@/lib/workshop-options";

import { type BookingState, bookWorkshop } from "./actions";

const initial: BookingState = { status: "idle" };

export type Session = {
  id: string;
  kind: WorkshopKind;
  title: string;
  description: string | null;
  host: string | null;
  location: string | null;
  day: number;
  startsAt: string;
  endsAt: string;
  left: number;
};

/**
 * Booking from the ticket page: everything on offer, what this ticket
 * already holds, and one button per session. The reasons a button is off -
 * full, a clash, not in this tier - are said in words rather than left as a
 * dead control.
 */
export function Workshops({
  code,
  lang,
  tierId,
  sessions,
  booked,
  remaining,
}: {
  code: string;
  lang: Lang;
  tierId: string;
  sessions: Session[];
  booked: string[];
  remaining: Record<WorkshopKind, number | null>;
}) {
  const [state, action, pending] = useActionState(bookWorkshop, initial);
  const t = BOOKING[lang];
  const mine = sessions.filter((s) => booked.includes(s.id));

  const clash = (s: Session) =>
    mine.some((m) => m.id !== s.id && m.day === s.day && m.startsAt < s.endsAt && s.startsAt < m.endsAt);

  return (
    <section className="mt-6 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8 print:hidden">
      <h2 className="text-lg font-bold tracking-tight text-bh-ink">{t.title}</h2>
      {sessions.length === 0 ? (
        <p className="mt-2 text-sm text-bh-ink/60">{t.none}</p>
      ) : remaining.workshop === 0 && remaining.experience === 0 && mine.length === 0 ? (
        <p className="mt-2 text-sm text-bh-ink/60">{t.coreNote}</p>
      ) : (
        <>
          <p className="mt-1 text-xs leading-relaxed text-bh-ink/55">{t.intro}</p>
          {mine.length > 0 && (
            <p className="mt-3 rounded-2xl bg-bh-paper px-4 py-3 text-sm text-bh-ink ring-1 ring-bh-ink/8">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.15em] text-bh-ink/50">{t.yours}</span>
              <span className="mt-1 block">
                {mine
                  .slice()
                  .sort((a, b) => a.day - b.day || a.startsAt.localeCompare(b.startsAt))
                  .map((m) => `${m.day === 1 ? t.day1 : t.day2} ${m.startsAt} · ${m.title}`)
                  .join(" · ")}
              </span>
            </p>
          )}

          {[1, 2].map((day) => {
            const forDay = sessions.filter((s) => s.day === day);
            if (forDay.length === 0) return null;
            return (
              <div key={day} className="mt-4">
                <h3 className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bh-ink/50">{day === 1 ? t.day1 : t.day2}</h3>
                <ul className="mt-2 flex flex-col divide-y divide-bh-ink/8">
                  {forDay.map((s) => {
                    const isBooked = booked.includes(s.id);
                    const allowance = remaining[s.kind];
                    const reason = isBooked
                      ? null
                      : s.left === 0
                        ? t.full
                        : clash(s)
                          ? t.clash
                          : allowance === 0
                            ? (tierId === "core" ? t.notAllowed : t.usedUp)
                            : null;
                    return (
                      <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-bh-ink/60">{s.startsAt}-{s.endsAt}</span>
                            <span className="rounded-full bg-bh-ink/8 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-bh-ink/70">
                              {kindLabel(s.kind, lang === "en")}
                            </span>
                          </div>
                          <div className={`mt-1 text-sm font-semibold ${isBooked ? "text-bh-pine" : "text-bh-ink"}`}>{s.title}</div>
                          {(s.host || s.location || s.description) && (
                            <div className="text-xs leading-relaxed text-bh-ink/60">
                              {[s.host, s.location].filter(Boolean).join(" · ")}
                              {s.description ? `${s.host || s.location ? " · " : ""}${s.description}` : ""}
                            </div>
                          )}
                          {!isBooked && !reason && s.left <= 5 && (
                            <div className="mt-0.5 text-xs font-semibold text-bh-pine">{t.left(s.left)}</div>
                          )}
                        </div>
                        <form action={action} className="shrink-0">
                          <input type="hidden" name="code" value={code} />
                          <input type="hidden" name="workshopId" value={s.id} />
                          <input type="hidden" name="lang" value={lang} />
                          {isBooked && <input type="hidden" name="cancel" value="1" />}
                          {reason ? (
                            <span className="block max-w-[10rem] text-right text-xs text-bh-ink/45">{reason}</span>
                          ) : (
                            <button
                              type="submit"
                              disabled={pending}
                              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
                                isBooked ? "border border-bh-ink/25 text-bh-ink/70 hover:border-bh-ink" : "bg-bh-ink text-bh-paper"
                              }`}
                            >
                              {pending ? (isBooked ? t.cancelling : t.booking) : isBooked ? t.cancel : t.book}
                            </button>
                          )}
                        </form>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          {state.status === "error" && <p className="mt-3 text-sm text-red-700">{state.message}</p>}
        </>
      )}
    </section>
  );
}
