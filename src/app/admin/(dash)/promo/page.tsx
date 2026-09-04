import type { Metadata } from "next";

import { HomeLink } from "@/components/admin/HomeLink";
import { requireAccess } from "@/lib/access";
import { listPromos } from "@/lib/promo";
import { formatPrice } from "@/lib/tickets";

import { removePromo, togglePromo } from "./actions";
import { PromoForm } from "./Forms";

export const metadata: Metadata = {
  title: "Промо кодове | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const bgDate = (d: Date) => d.toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Sofia" });

/** Discount codes: who they are for, how many times they were used, what they cost and brought. */
export default async function PromoPage() {
  await requireAccess("promo");
  const codes = await listPromos();
  const totals = codes.reduce(
    (a, c) => ({ uses: a.uses + c.uses, tickets: a.tickets + c.tickets, discount: a.discount + c.discountCents, revenue: a.revenue + c.revenueCents }),
    { uses: 0, tickets: 0, discount: 0, revenue: 0 },
  );

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">Промо кодове</h1>
          </div>
          <HomeLink />
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-bh-ink/60">
          Купувачът въвежда кода на страницата за плащане. Отстъпката е от крайната
          цена с ДДС и излиза като отделен ред във фактурата. Код за 100 % прави
          билета безплатен: издава се веднага, без плащане и без фактура - удобно
          за лектори и гости на партньори. Използван код не може да се изтрие, само
          да се спре.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Поръчки с код", totals.uses, `${totals.tickets} билета`],
            ["Отстъпени", `${formatPrice(totals.discount)} €`, "общо, с ДДС"],
            ["Платено с код", `${formatPrice(totals.revenue)} €`, "след отстъпката"],
            ["Активни кодове", codes.filter((c) => c.active && !c.expired && !c.exhausted).length, `от ${codes.length}`],
          ].map(([l, v, s]) => (
            <div key={String(l)} className="rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">{l}</div>
              <div className="mt-3 text-3xl font-black tracking-tight text-bh-ink">{v}</div>
              <div className="mt-1 text-xs text-bh-ink/55">{s}</div>
            </div>
          ))}
        </div>

        <section className="mt-6 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Нов код</h2>
          <div className="mt-4"><PromoForm /></div>
        </section>

        <section className="mt-6 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Кодове</h2>
          {codes.length === 0 ? (
            <p className="mt-4 text-sm text-bh-ink/55">Още няма кодове.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[56rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-bh-ink/10 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/50">
                    <th className="px-3 py-2 font-medium">Код</th>
                    <th className="px-3 py-2 font-medium">Отстъпка</th>
                    <th className="px-3 py-2 font-medium">Ползван</th>
                    <th className="px-3 py-2 font-medium">Валиден до</th>
                    <th className="px-3 py-2 font-medium">За кого</th>
                    <th className="px-3 py-2 font-medium">Отстъпено · платено</th>
                    <th className="px-3 py-2 font-medium">Статус</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => {
                    const state = !c.active ? "спрян" : c.expired ? "изтекъл" : c.exhausted ? "изчерпан" : "активен";
                    return (
                      <tr key={c.id} className="border-b border-bh-ink/6 last:border-0">
                        <td className="px-3 py-2 font-mono font-semibold text-bh-ink">{c.code}</td>
                        <td className="px-3 py-2 text-bh-ink">{c.label}</td>
                        <td className="px-3 py-2 text-bh-ink/75">{c.uses}{c.maxUses ? ` / ${c.maxUses}` : ""}{c.tickets ? ` · ${c.tickets} билета` : ""}</td>
                        <td className="px-3 py-2 text-bh-ink/75">{c.validUntil ? bgDate(c.validUntil) : "-"}</td>
                        <td className="px-3 py-2 text-bh-ink/75">{c.note ?? "-"}</td>
                        <td className="px-3 py-2 text-bh-ink/75">{formatPrice(c.discountCents)} € · {formatPrice(c.revenueCents)} €</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${state === "активен" ? "bg-[#0E8C7D]/15 text-[#0b6d61]" : "bg-bh-ink/10 text-bh-ink/60"}`}>
                            {state}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <form action={togglePromo}>
                              <input type="hidden" name="id" value={c.id} />
                              <input type="hidden" name="to" value={c.active ? "0" : "1"} />
                              <button type="submit" className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink">
                                {c.active ? "Спри" : "Пусни"}
                              </button>
                            </form>
                            {c.uses === 0 && (
                              <form action={removePromo}>
                                <input type="hidden" name="id" value={c.id} />
                                <button type="submit" className="rounded-full px-3 py-1.5 text-xs font-semibold text-bh-ink/50 transition-colors hover:text-red-600">Изтрий</button>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
