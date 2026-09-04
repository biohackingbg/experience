import type { Metadata } from "next";
import Link from "next/link";

import { HomeLink } from "@/components/admin/HomeLink";
import { requireAccess } from "@/lib/access";
import { getPreparation } from "@/lib/preparation";

import { markReceived, saveContact, saveDeliverable } from "./actions";

export const metadata: Metadata = {
  title: "Подготовка | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const bgDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};
const bgDateTime = (d: Date) =>
  d.toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", timeZone: "Europe/Sofia" });

const input =
  "rounded-full border border-bh-ink/15 bg-bh-paper px-3 py-1.5 text-xs text-bh-ink placeholder:text-bh-ink/35";
const small =
  "rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink";

/**
 * What each confirmed partner has promised, and what has arrived. The
 * promises come from the pipeline row in Презентация; this page is where
 * they get ticked off, dated and chased.
 */
export default async function PreparationPage() {
  await requireAccess("podgotovka");
  const p = await getPreparation();

  return (
    <div className="min-h-screen rounded-[1.75rem] bg-bh-paper px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">Подготовка</h1>
          </div>
          <HomeLink />
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bh-ink/60">
          Всичко, което потвърдените партньори са обещали - щандове, продукти,
          лектори, билети - и дали вече е при нас. Какво обещава всеки се
          отбелязва на неговия ред в{" "}
          <Link href="/admin/prezentaciya" className="underline underline-offset-2">Презентация</Link>;
          тук се отмята кога пристига, със срок и лице за контакт.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">Получено</div>
            <div className="mt-3 text-3xl font-black tracking-tight text-bh-ink">
              {p.received} <span className="text-lg font-semibold text-bh-ink/45">от {p.total}</span>
            </div>
          </div>
          <div className={`rounded-2xl p-6 ring-1 ${p.overdue ? "bg-[#C4607F]/10 ring-[#C4607F]/30" : "bg-bh-cloud ring-bh-ink/8"}`}>
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">Просрочени</div>
            <div className="mt-3 text-3xl font-black tracking-tight text-bh-ink">{p.overdue}</div>
          </div>
          <div className="rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">По вид</div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.byKind.length === 0 ? (
                <span className="text-sm text-bh-ink/50">още нищо не е уговорено</span>
              ) : (
                p.byKind.map((k) => (
                  <span key={k.kind} className="rounded-full bg-bh-paper px-2.5 py-1 text-xs text-bh-ink ring-1 ring-bh-ink/10">
                    {k.label} {k.received}/{k.total}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {p.partners.length === 0 ? (
          <p className="mt-10 rounded-2xl bg-bh-cloud px-6 py-8 text-center text-sm text-bh-ink/55 ring-1 ring-bh-ink/8">
            Няма потвърдени партньори с уговорени неща. Отбележи какво дава всеки
            на реда му в Презентация и той ще се появи тук.
          </p>
        ) : (
          <div className="mt-10 flex flex-col gap-5">
            {p.partners.map((partner) => (
              <section key={partner.id} className="rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-bh-ink">
                      {partner.label}
                      <span className={`ml-3 text-sm font-semibold ${partner.received === partner.total ? "text-[#0b6d61]" : "text-bh-ink/50"}`}>
                        {partner.received}/{partner.total}
                      </span>
                    </h2>
                    {partner.owner && <p className="mt-0.5 text-xs text-bh-ink/55">води {partner.owner}</p>}
                  </div>
                  {/* Who to call when something is late. */}
                  <form action={saveContact} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="linkId" value={partner.id} />
                    <input name="name" defaultValue={partner.contactName ?? ""} placeholder="лице за контакт" className={`${input} w-40`} />
                    <input name="email" type="email" defaultValue={partner.contactEmail ?? ""} placeholder="имейл" className={`${input} w-44`} />
                    <input name="phone" defaultValue={partner.contactPhone ?? ""} placeholder="телефон" className={`${input} w-32`} />
                    <button type="submit" className={small}>Запиши</button>
                  </form>
                </div>

                {partner.items.length === 0 ? (
                  <p className="mt-4 text-sm text-bh-ink/50">Потвърден, но без отбелязано какво дава.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-bh-ink/8">
                    {partner.items.map((item) => (
                      <li key={item.kind} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="flex min-w-[14rem] items-center gap-3">
                          <form action={markReceived}>
                            <input type="hidden" name="linkId" value={partner.id} />
                            <input type="hidden" name="kind" value={item.kind} />
                            <input type="hidden" name="to" value={item.receivedAt ? "0" : "1"} />
                            <button
                              type="submit"
                              aria-label={item.receivedAt ? "Върни в чакащи" : "Отбележи като получено"}
                              className={`flex h-7 w-7 items-center justify-center rounded-full ring-1 transition-colors ${
                                item.receivedAt
                                  ? "bg-[#0E8C7D] text-white ring-[#0E8C7D]"
                                  : "bg-bh-paper text-transparent ring-bh-ink/25 hover:ring-bh-ink"
                              }`}
                            >
                              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
                                <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </form>
                          <div>
                            <div className={`text-sm font-medium ${item.receivedAt ? "text-bh-ink/50 line-through" : "text-bh-ink"}`}>
                              {item.label}
                            </div>
                            <div className="text-xs">
                              {item.receivedAt ? (
                                <span className="text-[#0b6d61]">получено {bgDateTime(item.receivedAt)}</span>
                              ) : item.overdue ? (
                                <span className="font-semibold text-[#9c3d5c]">просрочено · срок {bgDate(item.dueDate!)}</span>
                              ) : item.dueDate ? (
                                <span className="text-bh-ink/55">чака · срок {bgDate(item.dueDate)}</span>
                              ) : (
                                <span className="text-bh-ink/55">чака · без срок</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <form action={saveDeliverable} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="linkId" value={partner.id} />
                          <input type="hidden" name="kind" value={item.kind} />
                          <input name="due" type="date" defaultValue={item.dueDate ?? ""} className={`${input} w-36`} />
                          <input name="note" defaultValue={item.note ?? ""} placeholder="бележка: размер, брой, кой носи" className={`${input} w-64`} />
                          <button type="submit" className={small}>Запиши</button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
