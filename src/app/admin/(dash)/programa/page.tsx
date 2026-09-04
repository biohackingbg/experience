import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { HomeLink } from "@/components/admin/HomeLink";
import { isAdmin } from "@/lib/admin-auth";
import { PROGRAM } from "@/lib/program";
import { listSessions, peopleList } from "@/lib/program-data";

import { seedProgram, shiftSession } from "./actions";
import { NewSessionForm, SessionEditor } from "./Forms";

export const metadata: Metadata = {
  title: "Програма | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** The programme, slot by slot, with the same fields the site renders. */
export default async function ProgramAdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const rows = await listSessions();
  const seeded = rows.length > 0;

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">Програма</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/programa" target="_blank" className="rounded-full border border-bh-ink/20 px-4 py-2 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink">
              Виж на сайта
            </Link>
            <HomeLink />
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-bh-ink/60">
          Всяка сесия с час, заглавие, описание, водещ и участници, точно както
          излиза на сайта - на началната страница и на /programa. Промените се
          виждат до пет минути. Датите и мотото на дните са фиксирани в кода.
        </p>

        {!seeded ? (
          <section className="mt-8 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
            <h2 className="text-lg font-bold tracking-tight text-bh-ink">Първо: вземи програмата от сайта</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bh-ink/60">
              Сайтът в момента показва програмата, записана в кода ({PROGRAM.reduce((a, d) => a + d.slots.length, 0)} сесии).
              Едно натискане я копира тук; след това редактираш от тази страница, а кодът спира да се чете.
            </p>
            <form action={seedProgram} className="mt-4">
              <button type="submit" className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper">
                Импортирай програмата
              </button>
            </form>
          </section>
        ) : (
          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            {PROGRAM.map((meta, di) => {
              const day = di + 1;
              const list = rows.filter((r) => r.day === day);
              return (
                <section key={day} className="rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-lg font-bold tracking-tight text-bh-ink">{meta.day}</h2>
                    <span className="font-mono text-sm text-bh-ink/50">{meta.date}</span>
                    <span className="text-xs text-bh-ink/50">· {meta.theme}</span>
                  </div>
                  <ul className="mt-4 flex flex-col divide-y divide-bh-ink/6">
                    {list.map((s, i) => (
                      <li key={s.id} className={`py-3 ${s.pause ? "opacity-70" : ""}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 gap-3">
                            <div className="flex flex-col gap-0.5">
                              {(["up", "down"] as const).map((dir) => (
                                <form key={dir} action={shiftSession}>
                                  <input type="hidden" name="id" value={s.id} />
                                  <input type="hidden" name="dir" value={dir} />
                                  <button
                                    type="submit"
                                    disabled={dir === "up" ? i === 0 : i === list.length - 1}
                                    aria-label={dir === "up" ? "нагоре" : "надолу"}
                                    className="h-5 w-6 rounded text-xs text-bh-ink/50 hover:bg-bh-ink/8 hover:text-bh-ink disabled:opacity-25"
                                  >
                                    {dir === "up" ? "▲" : "▼"}
                                  </button>
                                </form>
                              ))}
                            </div>
                            <div className="min-w-0">
                              <div className="font-mono text-[0.7rem] text-bh-ink/50">{s.time}</div>
                              <div className={`text-sm ${s.pause ? "text-bh-ink/60" : "font-semibold text-bh-ink"}`}>{s.title}</div>
                              {s.role && <div className="mt-0.5 font-mono text-[0.62rem] uppercase tracking-wide text-bh-ink/40">{s.role}</div>}
                              {peopleList(s.people).length > 0 && (
                                <div className="mt-0.5 text-xs font-medium text-bh-pine">{peopleList(s.people).join(" · ")}</div>
                              )}
                            </div>
                          </div>
                          <SessionEditor s={s} />
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4"><NewSessionForm day={day} /></div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
