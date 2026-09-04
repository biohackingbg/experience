import type { Metadata } from "next";

import { HomeLink } from "@/components/admin/HomeLink";
import { PrintButton } from "@/components/admin/PrintButton";
import { requireAccess } from "@/lib/access";
import { byPerson, clashes, listShifts } from "@/lib/shifts";
import { DAYS } from "@/lib/shifts-options";

import { copySaturday } from "./actions";
import { NewShiftForm, ShiftEditor } from "./Forms";

export const metadata: Metadata = {
  title: "Смени | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The rota: who is on which zone at which hour, one sheet per day when
 * printed, and the same list turned round by person so everyone can be
 * handed their own hours.
 */
export default async function ShiftsPage() {
  await requireAccess("smeni");
  const list = await listShifts();
  const bad = clashes(list);
  const people = byPerson(list);

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">Смени</h1>
            {list.length > 0 && (
              <p className="mt-2 text-sm text-bh-ink/60">
                {list.length} смени · {people.length} души
                {bad.size > 0 && <span className="ml-2 font-semibold text-[#9c3d5c]">· {bad.size} застъпвания</span>}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NewShiftForm />
            {list.some((s) => s.day === 1) && (
              <form action={copySaturday}>
                <button type="submit" className="rounded-full border border-bh-ink/20 px-4 py-2 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink">
                  Копирай съботата в неделя
                </button>
              </form>
            )}
            <PrintButton label="Печат на графика" />
            <HomeLink />
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-bh-ink/60 print:hidden">
          По една смяна на ред: ден, зона, от-до, кой и телефон. Един и същи човек на две места в един
          час се отбелязва в червено. „Печат“ дава по един лист на ден плюс списък по човек, за да
          може всеки да си получи своите часове. „Копирай съботата в неделя“ заменя неделния график
          със съботния.
        </p>

        {list.length === 0 ? (
          <p className="mt-8 rounded-3xl bg-bh-cloud px-6 py-8 text-center text-sm text-bh-ink/55 ring-1 ring-bh-ink/6">
            Още няма смени. Добави първата - зона, час и човек.
          </p>
        ) : (
          <>
            {[1, 2].map((day) => {
              const forDay = list.filter((s) => s.day === day);
              if (forDay.length === 0) return null;
              const zones = [...new Set(forDay.map((s) => s.zone))];
              return (
                <section key={day} className="mt-8 print:break-after-page">
                  <h2 className="text-lg font-bold tracking-tight text-bh-ink print:text-2xl">{DAYS[day]}</h2>
                  <div className="mt-3 grid gap-4 md:grid-cols-2 print:grid-cols-2">
                    {zones.map((zone) => (
                      <div key={zone} className="rounded-2xl bg-bh-cloud p-4 ring-1 ring-bh-ink/6 print:break-inside-avoid print:ring-bh-ink/30">
                        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/55">{zone}</p>
                        <ul className="mt-2 flex flex-col divide-y divide-bh-ink/6">
                          {forDay
                            .filter((s) => s.zone === zone)
                            .map((s) => (
                              <li key={s.id} className="py-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="min-w-0 text-sm">
                                    <span className="font-mono text-xs text-bh-ink/60">{s.startsAt}-{s.endsAt}</span>
                                    <span className={`ml-2 font-semibold ${bad.has(s.id) ? "text-[#9c3d5c]" : "text-bh-ink"}`}>{s.person}</span>
                                    {s.phone && <span className="ml-2 text-xs text-bh-ink/55">{s.phone}</span>}
                                    {s.note && <span className="block text-xs text-bh-ink/55">{s.note}</span>}
                                    {bad.has(s.id) && <span className="block text-xs font-semibold text-[#9c3d5c]">застъпва се с друга смяна</span>}
                                  </div>
                                  <ShiftEditor s={s} />
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            <section className="mt-10">
              <h2 className="text-lg font-bold tracking-tight text-bh-ink print:text-2xl">По човек</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
                {people.map((p) => (
                  <li key={p.person} className="rounded-2xl bg-bh-cloud p-4 ring-1 ring-bh-ink/6 print:break-inside-avoid print:ring-bh-ink/30">
                    <p className="font-semibold text-bh-ink">
                      {p.person}
                      {p.phone && <span className="ml-2 text-xs font-normal text-bh-ink/55">{p.phone}</span>}
                    </p>
                    <ul className="mt-1 text-xs leading-relaxed text-bh-ink/70">
                      {p.shifts.map((s) => (
                        <li key={s.id} className={bad.has(s.id) ? "text-[#9c3d5c]" : ""}>
                          {DAYS[s.day].split(" ")[0]} {s.startsAt}-{s.endsAt} · {s.zone}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
