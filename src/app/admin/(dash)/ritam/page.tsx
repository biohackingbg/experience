import type { Metadata } from "next";
import Link from "next/link";

import { HomeLink } from "@/components/admin/HomeLink";
import { requireAccess } from "@/lib/access";
import { PHASES, WEEK_TARGET, checkinsByDay, dateOfDay, dayNumber, listChallenges, listParticipants, pushConfiguredForAdmin } from "@/lib/challenge-admin";

import { ChallengeForm, TestPushForm } from "./Forms";

export const metadata: Metadata = {
  title: "30 дни ритъм | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const bgDate = (d: string | Date) =>
  (typeof d === "string" ? new Date(`${d}T12:00:00Z`) : d).toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", timeZone: "Europe/Sofia" });

/** The challenge: its dates, who is in, how the days go, and a test push. */
export default async function ChallengeAdminPage() {
  await requireAccess("ritam");
  const all = await listChallenges();
  const c = all.find((x) => x.active) ?? all[0] ?? null;
  const [people, byDay] = c ? await Promise.all([listParticipants(c.id), checkinsByDay(c.id)]) : [[], []];
  const today = c ? dayNumber(c.startsOn) : 0;
  const active = people.filter((p) => !p.leftAt);
  const elapsed = c ? Math.max(0, Math.min(c.days, today)) : 0;
  const cohorts = [...new Set(active.map((p) => p.cohort))].sort((a, b) => a - b);
  const finished = c && today > c.days ? active.filter((p) => p.rhythmDays >= Math.round(c.days * 0.6)).length : null;
  const todayCheckins = byDay.find((d) => d.day === today)?.checkins ?? 0;
  const maxBar = Math.max(1, ...byDay.map((d) => d.checkins));
  const pushOk = pushConfiguredForAdmin();

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 font-display text-3xl font-[900] uppercase tracking-tight text-bh-ink">30 дни ритъм</h1>
            {c && (
              <p className="mt-2 text-sm text-bh-ink/60">
                {bgDate(c.startsOn)} – {bgDate(dateOfDay(c.startsOn, c.days))} ·{" "}
                {today < 1 ? `започва след ${1 - today} дни` : today > c.days ? "приключило" : `ден ${today} от ${c.days}`} · {active.length} участници
                {c.active ? "" : " · неактивно"}
              </p>
            )}
          </div>
          <HomeLink />
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-bh-ink/60">
          Предизвикателството в приложението: всеки ден един тап „станах в прозореца си“, по една нова стъпка на седмица, групи по {c?.cohortSize ?? 20} души.
          Сървърът пази само кой е вътре и четирите „да/не“ на ден. Крачки, час на ставане и измервания остават в телефона на човека.
          Известията вървят сами в 07:30 и 20:30. Офертите за ден 30 се правят от{" "}
          <Link href="/admin/oferti" className="underline">Оферти</Link>.
        </p>
        {!pushOk && (
          <p className="mt-3 rounded-2xl bg-[#d0a11a]/15 px-4 py-3 text-sm text-[#7a5b00]">
            Push известията не са настроени на сървъра (липсват APNS_KEY_ID, APNS_KEY_P8 или APNS_BUNDLE_ID във Vercel). Приложението работи, но никой няма да получи напомняне.
          </p>
        )}

        {c ? (
          <>
            <section className="mt-6">
              <h2 className="text-lg font-bold tracking-tight text-bh-ink">Издание</h2>
              <div className="mt-3">
                <ChallengeForm c={{ id: c.id, title: c.title, startsOn: c.startsOn, days: c.days, cohortSize: c.cohortSize, active: c.active }} />
              </div>
              <ol className="mt-3 grid gap-2 text-xs text-bh-ink/60 sm:grid-cols-4">
                {PHASES.slice(0, 4).map((p) => (
                  <li key={p.week} className="rounded-xl bg-bh-cloud px-3 py-2 ring-1 ring-bh-ink/6">
                    <span className="font-semibold text-bh-ink">Седмица {p.week}</span> · {p.title}
                    <div className="mt-0.5">{p.asks.map((a) => ({ wake: "ставане", light: "светлина", walk: "разходка", bed: "лягане" })[a]).join(" + ")}</div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-8 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-bh-cloud p-4 ring-1 ring-bh-ink/6">
                <div className="text-xs text-bh-ink/55">Участници</div>
                <div className="mt-1 text-2xl font-black text-bh-ink">{active.length}</div>
                <div className="text-xs text-bh-ink/55">{people.length - active.length} излезли · {cohorts.length} групи</div>
              </div>
              <div className="rounded-2xl bg-bh-cloud p-4 ring-1 ring-bh-ink/6">
                <div className="text-xs text-bh-ink/55">Отбелязали днес</div>
                <div className="mt-1 text-2xl font-black text-bh-ink">{today >= 1 && today <= c.days ? todayCheckins : "–"}</div>
                <div className="text-xs text-bh-ink/55">{active.length > 0 && today >= 1 && today <= c.days ? `${Math.round((todayCheckins / active.length) * 100)}% от участниците` : "преди началото"}</div>
              </div>
              <div className="rounded-2xl bg-bh-cloud p-4 ring-1 ring-bh-ink/6">
                <div className="text-xs text-bh-ink/55">Среден ритъм</div>
                <div className="mt-1 text-2xl font-black text-bh-ink">
                  {elapsed > 0 && active.length > 0 ? `${Math.round((active.reduce((a, p) => a + p.rhythmDays, 0) / active.length / elapsed) * 100)}%` : "–"}
                </div>
                <div className="text-xs text-bh-ink/55">дни „в прозореца“ от изминалите</div>
              </div>
              <div className="rounded-2xl bg-bh-cloud p-4 ring-1 ring-bh-ink/6">
                <div className="text-xs text-bh-ink/55">{finished === null ? `Цел на седмица` : "Завършили"}</div>
                <div className="mt-1 text-2xl font-black text-bh-ink">{finished === null ? `${WEEK_TARGET} / 7` : finished}</div>
                <div className="text-xs text-bh-ink/55">{finished === null ? "дни с ритъм, с една поправка" : `с поне 60% дни в ритъм · ${active.length > 0 ? Math.round((finished / active.length) * 100) : 0}%`}</div>
              </div>
            </section>

            {byDay.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-bold tracking-tight text-bh-ink">Отбелязвания по дни</h2>
                <div className="mt-3 flex h-32 items-end gap-1 rounded-2xl bg-bh-cloud p-4 ring-1 ring-bh-ink/6">
                  {Array.from({ length: Math.min(c.days, Math.max(elapsed, 1)) }, (_, i) => i + 1).map((d) => {
                    const row = byDay.find((r) => r.day === d);
                    const h = row ? Math.max(4, Math.round((row.checkins / maxBar) * 96)) : 2;
                    const r = row ? Math.round((row.rhythm / maxBar) * 96) : 0;
                    return (
                      <div key={d} className="relative flex-1" title={`Ден ${d}: ${row?.checkins ?? 0} отбелязали, ${row?.rhythm ?? 0} в ритъм`}>
                        <div className="absolute bottom-0 w-full rounded-t bg-bh-ink/15" style={{ height: h }} />
                        <div className="absolute bottom-0 w-full rounded-t bg-bh-pine" style={{ height: r }} />
                      </div>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-bh-ink/50">Тъмно зелено: дни в ритъм. Сиво: всички отбелязали.</p>
              </section>
            )}

            <section className="mt-8">
              <h2 className="text-lg font-bold tracking-tight text-bh-ink">Участници</h2>
              {people.length === 0 ? (
                <p className="mt-3 text-sm text-bh-ink/55">Още никой не се е записал. Записването е от приложението.</p>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-2xl bg-bh-cloud ring-1 ring-bh-ink/6">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-bh-ink/50">
                      <tr>
                        <th className="px-4 py-2">Група</th>
                        <th className="px-4 py-2">Имейл</th>
                        <th className="px-4 py-2">Ставане</th>
                        <th className="px-4 py-2">Лягане</th>
                        <th className="px-4 py-2">Отбелязани</th>
                        <th className="px-4 py-2">В ритъм</th>
                        <th className="px-4 py-2">Последно</th>
                        <th className="px-4 py-2">Записан</th>
                      </tr>
                    </thead>
                    <tbody>
                      {people.map((p) => (
                        <tr key={p.email} className={`border-t border-bh-ink/6 ${p.leftAt ? "opacity-50" : ""}`}>
                          <td className="px-4 py-2 font-mono text-xs">{p.cohort}</td>
                          <td className="px-4 py-2">{p.email}{p.leftAt ? <span className="ml-2 text-xs text-bh-ink/50">излязъл</span> : null}</td>
                          <td className="px-4 py-2 font-mono text-xs">{p.wakeTarget}</td>
                          <td className="px-4 py-2 font-mono text-xs">{p.bedTarget ?? "–"}</td>
                          <td className="px-4 py-2">{p.checkins}{elapsed > 0 ? <span className="text-xs text-bh-ink/50"> / {elapsed}</span> : null}</td>
                          <td className="px-4 py-2">{p.rhythmDays}</td>
                          <td className="px-4 py-2 text-xs text-bh-ink/60">{p.lastDay ? `ден ${p.lastDay}` : "–"}</td>
                          <td className="px-4 py-2 text-xs text-bh-ink/60">{bgDate(p.joinedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-bold tracking-tight text-bh-ink">Тестово известие</h2>
              <p className="mt-1 text-xs text-bh-ink/55">Праща се само на този имейл, за да видиш как изглежда на телефона.</p>
              <div className="mt-3">
                <TestPushForm defaultEmail="" />
              </div>
            </section>
          </>
        ) : (
          <p className="mt-8 rounded-3xl bg-bh-cloud px-6 py-8 text-center text-sm text-bh-ink/55 ring-1 ring-bh-ink/6">Няма издание в базата.</p>
        )}
      </div>
    </div>
  );
}
