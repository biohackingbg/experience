import type { Metadata } from "next";

import { PrintButton } from "@/components/admin/PrintButton";
import { HomeLink } from "@/components/admin/HomeLink";
import { requireAccess } from "@/lib/access";
import { kindLabel } from "@/lib/workshop-options";
import { listWorkshopAttendees, listWorkshops } from "@/lib/workshops";

import { NewWorkshopForm, WorkshopEditor } from "./Forms";

export const metadata: Metadata = {
  title: "Работилници | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const DAYS = ["", "Събота 07.11", "Неделя 08.11"];

/** Workshops and experiences, their places, and who booked them. */
export default async function WorkshopsAdminPage() {
  await requireAccess("rabotilnici");
  const list = await listWorkshops(true);
  const attendees = Object.fromEntries(
    await Promise.all(list.map(async (w) => [w.id, w.booked > 0 ? await listWorkshopAttendees(w.id) : []] as const)),
  );
  const totals = list.reduce((a, w) => ({ places: a.places + w.capacity, booked: a.booked + w.booked }), { places: 0, booked: 0 });

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">Работилници</h1>
            {list.length > 0 && (
              <p className="mt-2 text-sm text-bh-ink/60">{list.length} сесии · заети {totals.booked} от {totals.places} места</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <NewWorkshopForm />
            <PrintButton label="Печат на списъците" />
            <HomeLink />
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-bh-ink/60 print:hidden">
          Купувачът се записва от страницата на билета си. Кой какво може: CORE - нищо,
          PLUS - работилниците и едно преживяване по избор, PEAK - всичко. Никой не може
          да е записан за две неща в един и същи час. Сесия със записани хора не се трие,
          а се затваря („отворена за записване“).
        </p>

        {list.length === 0 ? (
          <p className="mt-8 rounded-3xl bg-bh-cloud px-6 py-8 text-center text-sm text-bh-ink/55 ring-1 ring-bh-ink/6">
            Още няма работилници. Добави първата - и тя веднага се появява на билетите.
          </p>
        ) : (
          [1, 2].map((day) => {
            const forDay = list.filter((w) => w.day === day);
            if (forDay.length === 0) return null;
            return (
              <section key={day} className="mt-6">
                <h2 className="text-lg font-bold tracking-tight text-bh-ink">{DAYS[day]}</h2>
                <ul className="mt-3 flex flex-col gap-3">
                  {forDay.map((w) => (
                    <li key={w.id} className={`rounded-2xl bg-bh-cloud p-5 ring-1 ring-bh-ink/6 ${w.active ? "" : "opacity-60"}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-bh-ink/60">{w.startsAt}-{w.endsAt}</span>
                            <span className="rounded-full bg-bh-ink/8 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-bh-ink/70">{kindLabel(w.kind)}</span>
                            {!w.active && <span className="rounded-full bg-[#d0a11a]/15 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-[#7a5c05]">затворена</span>}
                          </div>
                          <div className="mt-1 font-semibold text-bh-ink">{w.title}</div>
                          <div className="text-xs text-bh-ink/60">
                            {[w.host, w.location].filter(Boolean).join(" · ")}
                            {w.description ? ` · ${w.description}` : ""}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-sm font-semibold ${w.left === 0 ? "text-[#9c3d5c]" : "text-bh-ink"}`}>
                            {w.booked} / {w.capacity}
                            <span className="ml-1 text-xs font-normal text-bh-ink/55">{w.left === 0 ? "пълна" : `свободни ${w.left}`}</span>
                          </span>
                          <WorkshopEditor w={w} />
                        </div>
                      </div>
                      {w.booked > 0 && (
                        <details className="mt-3 print:open" open={false}>
                          <summary className="cursor-pointer text-xs font-semibold text-bh-ink/70 print:hidden">Записани ({w.booked})</summary>
                          <ol className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                            {attendees[w.id].map((a, i) => (
                              <li key={a.code} className="flex items-baseline gap-2 text-bh-ink">
                                <span className="w-5 text-right text-xs text-bh-ink/40">{i + 1}.</span>
                                <span className="font-medium">{a.name}</span>
                                <span className="font-mono text-[0.65rem] text-bh-ink/50">{a.code}</span>
                                <span className="text-xs text-bh-ink/45">{a.tierName}</span>
                              </li>
                            ))}
                          </ol>
                        </details>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
