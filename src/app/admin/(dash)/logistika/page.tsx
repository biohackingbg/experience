import type { Metadata } from "next";
import Link from "next/link";

import { HomeLink } from "@/components/admin/HomeLink";
import { PrintButton } from "@/components/admin/PrintButton";
import { requireAccess } from "@/lib/access";
import { FILTERS, type LogisticsFilter, applyFilter, listLogistics, summarize } from "@/lib/speaker-logistics";

import { LogisticsEditor } from "./Forms";

export const metadata: Metadata = {
  title: "Логистика на лекторите | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const isFilter = (v: unknown): v is LogisticsFilter => FILTERS.some((f) => f.id === v);

/**
 * The sheet for the last weeks: who has confirmed, who still owes slides,
 * who lands when and who meets them. The gaps are the point - every filter
 * is a list of what is still to be done.
 */
export default async function LogisticsPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  await requireAccess("logistika");
  const { f } = await searchParams;
  const filter: LogisticsFilter = isFilter(f) ? f : "vsichki";
  const all = await listLogistics();
  const rows = applyFilter(all, filter);
  const sum = summarize(all);
  const unconfirmed = all.filter((r) => !r.confirmed);

  const tiles = [
    { label: "Потвърдени", value: `${sum.confirmed} / ${sum.total}`, f: "nepotvardeni" as const },
    { label: "Презентации", value: `${sum.presentation} / ${sum.total}`, f: "bez-prezentaciya" as const },
    { label: "Хотел (чужбина)", value: `${sum.hotel} / ${sum.abroad}`, f: "bez-hotel" as const },
    { label: "Час на пристигане", value: `${sum.arrival} / ${sum.total}`, f: "bez-pristigane" as const },
    { label: "Посрещач", value: `${sum.host} / ${sum.total}`, f: "bez-posreshtach" as const },
  ];

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">Логистика на лекторите</h1>
            <p className="mt-2 text-sm text-bh-ink/60">{sum.total} лектори · {sum.abroad} от чужбина</p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <PrintButton label="Печат на листа" />
            <HomeLink />
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-bh-ink/60 print:hidden">
          Един ред на лектор: потвърждение, пристигане и заминаване, хотел, техника, презентация,
          храна и кой го посреща. Плочките отгоре са и филтри - всяка отваря списъка с това, което
          още не е направено. Хотелът се брои само за хората от чужбина.
        </p>

        {all.length === 0 ? (
          <p className="mt-8 rounded-3xl bg-bh-cloud px-6 py-8 text-center text-sm text-bh-ink/55 ring-1 ring-bh-ink/6">
            Няма лектори в базата. Първо натисни „Импортирай“ в <Link href="/admin/lektori" className="underline">Лектори</Link>.
          </p>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-5 print:hidden">
              {tiles.map((t) => (
                <Link
                  key={t.label}
                  href={`/admin/logistika?f=${t.f}`}
                  className={`rounded-2xl p-4 ring-1 transition-colors ${filter === t.f ? "bg-bh-ink text-bh-paper ring-bh-ink" : "bg-bh-cloud ring-bh-ink/6 hover:ring-bh-ink/30"}`}
                >
                  <p className={`font-mono text-[0.6rem] uppercase tracking-[0.15em] ${filter === t.f ? "text-bh-paper/70" : "text-bh-ink/50"}`}>{t.label}</p>
                  <p className="mt-1 text-xl font-black tracking-tight">{t.value}</p>
                </Link>
              ))}
            </div>

            {unconfirmed.length > 0 && filter === "vsichki" && (
              <section className="mt-6 rounded-2xl bg-[#d0a11a]/10 p-5 ring-1 ring-[#d0a11a]/30 print:hidden">
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[#7a5c05]">Кой още не е потвърдил · {unconfirmed.length}</p>
                <p className="mt-2 text-sm leading-relaxed text-bh-ink/80">
                  {unconfirmed.map((r) => r.name).join(" · ")}
                </p>
              </section>
            )}

            <div className="mt-6 flex flex-wrap gap-2 print:hidden">
              {FILTERS.map((x) => (
                <Link
                  key={x.id}
                  href={x.id === "vsichki" ? "/admin/logistika" : `/admin/logistika?f=${x.id}`}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === x.id ? "bg-bh-ink text-bh-paper" : "bg-bh-ink/6 text-bh-ink/70 hover:bg-bh-ink/12"}`}
                >
                  {x.label}
                </Link>
              ))}
            </div>

            <ul className="mt-4 flex flex-col gap-3">
              {rows.length === 0 && (
                <li className="rounded-2xl bg-bh-cloud px-6 py-6 text-center text-sm text-bh-ink/55 ring-1 ring-bh-ink/6">Нищо за правене тук.</li>
              )}
              {rows.map((r) => (
                <li key={r.speakerId} className="rounded-2xl bg-bh-cloud p-5 ring-1 ring-bh-ink/6 print:break-inside-avoid print:p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-bh-ink">
                        {r.title ? `${r.title} ` : ""}{r.name}
                        {r.country && <span className="ml-2 text-xs font-normal text-bh-ink/50">{r.country}</span>}
                        {!r.announced && <span className="ml-2 rounded-full bg-bh-ink/8 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-bh-ink/60">не е обявен</span>}
                      </div>
                      <div className="mt-1 text-xs leading-relaxed text-bh-ink/65">
                        {[
                          r.arrives && `пристига ${r.arrives}`,
                          r.departs && `заминава ${r.departs}`,
                          r.hotel && `хотел: ${r.hotel}`,
                          r.host && `посреща: ${r.host}`,
                          r.tech && `техника: ${r.tech}`,
                          r.dietary && `храна: ${r.dietary}`,
                          r.phone,
                          r.email,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "Още нищо не е записано."}
                        {r.notes && <span className="block text-bh-ink/55">{r.notes}</span>}
                      </div>
                    </div>
                    <div className="hidden text-xs text-bh-ink/60 print:block">
                      {[r.confirmed ? "потвърден" : "НЕ Е ПОТВЪРДЕН", r.presentationAt ? "презентация ✓" : "без презентация"].join(" · ")}
                    </div>
                  </div>
                  <div className="mt-3">
                    <LogisticsEditor r={r} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
