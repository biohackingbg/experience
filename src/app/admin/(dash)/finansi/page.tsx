import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { HomeLink } from "@/components/admin/HomeLink";
import { isAdmin } from "@/lib/admin-auth";
import { MONEY, TIERS } from "@/lib/deck-links";
import { getFinances } from "@/lib/finances";
import { formatPrice } from "@/lib/tickets";

import { BudgetForm, ExpenseForm, ExpenseRow } from "./Forms";

export const metadata: Metadata = {
  title: "Финанси | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function Eur({ cents, signed = false }: { cents: number; signed?: boolean }) {
  return (
    <>
      {signed && cents >= 0 ? "+" : ""}
      {formatPrice(cents)} €
    </>
  );
}


const STATUS_TONE: Record<string, string> = {
  planned: "bg-bh-ink/10 text-bh-ink/60",
  invoiced: "bg-[#d0a11a]/20 text-[#7a5b00]",
  paid: "bg-[#0E8C7D]/15 text-[#0b6d61]",
  cancelled: "bg-bh-ink/5 text-bh-ink/35 line-through",
};

/**
 * What comes in, what goes out, and whether the event is in the black - all
 * net of VAT, with the cash view beside the promise view, because for an
 * event the difference between "we have 40 000" and "12 000 is in the bank"
 * is the whole story.
 */
export default async function FinancesPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const f = await getFinances();

  const incomeForecast = f.tickets.netCents + f.sponsors.totalCents;
  const incomeCash = f.tickets.netCents + f.sponsors.paidCents;

  return (
    <div className="min-h-screen rounded-[1.75rem] bg-bh-paper px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">Финанси</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/admin/finansi/eksport"
              className="rounded-full border border-bh-ink/20 px-4 py-2 text-sm font-semibold text-bh-ink transition-colors hover:border-bh-ink"
            >
              Експорт CSV
            </a>
            <HomeLink />
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bh-ink/60">
          Всичко е нето, без ДДС. Това е погледът на организатора, не счетоводството - книгите са при
          счетоводителя. Спонсорите идват от партньорския пипелайн: потвърден партньор със сума е сделка.
        </p>

        {/* The result, first and largest: cash beside forecast. */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className={`rounded-2xl p-6 ring-1 ${f.result.actualCents >= 0 ? "bg-[#0E8C7D]/10 ring-[#0E8C7D]/25" : "bg-[#C4607F]/10 ring-[#C4607F]/25"}`}>
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/55">Резултат сега · в сметката</div>
            <div className="mt-3 text-4xl font-black tracking-tight text-bh-ink"><Eur cents={f.result.actualCents} signed /></div>
            <div className="mt-1 text-xs text-bh-ink/60">платени приходи <Eur cents={incomeCash} /> минус платени разходи <Eur cents={f.expenses.paidCents} /></div>
          </div>
          <div className="rounded-2xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/55">Прогноза · ако всичко се плати и похарчи</div>
            <div className="mt-3 text-4xl font-black tracking-tight text-bh-ink"><Eur cents={f.result.forecastCents} signed /></div>
            <div className="mt-1 text-xs text-bh-ink/60">приходи <Eur cents={incomeForecast} /> минус разходи <Eur cents={f.expenses.plannedCents} /></div>
          </div>
        </div>

        {/* Income */}
        <section className="mt-12">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Приходи</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-bh-cloud p-5 ring-1 ring-bh-ink/8">
              <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bh-ink/50">Билети · нето</div>
              <div className="mt-2 text-2xl font-black text-bh-ink"><Eur cents={f.tickets.netCents} /></div>
              <div className="mt-1 text-xs text-bh-ink/55">{f.tickets.orders} платени поръчки · автоматично</div>
            </div>
            <div className="rounded-2xl bg-bh-cloud p-5 ring-1 ring-bh-ink/8">
              <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bh-ink/50">Спонсори · договорено</div>
              <div className="mt-2 text-2xl font-black text-bh-ink"><Eur cents={f.sponsors.totalCents} /></div>
              <div className="mt-1 text-xs text-bh-ink/55">{f.sponsors.rows.length} сделки</div>
            </div>
            <div className="rounded-2xl bg-bh-cloud p-5 ring-1 ring-bh-ink/8">
              <div className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bh-ink/50">Спонсори · в сметката</div>
              <div className="mt-2 text-2xl font-black text-bh-ink"><Eur cents={f.sponsors.paidCents} /></div>
              <div className="mt-1 text-xs text-bh-ink/55">фактурирано, още неплатено <Eur cents={f.sponsors.invoicedCents} /></div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl bg-bh-cloud ring-1 ring-bh-ink/8">
            {f.sponsors.rows.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-bh-ink/55">
                Още няма сделка със сума. В „Презентация“ сложи етап „потвърдил“ и сума на партньора - и се появява тук.
              </p>
            ) : (
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-bh-ink/10 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/50">
                    <th className="px-5 py-3 font-medium">Спонсор</th>
                    <th className="px-5 py-3 font-medium">Пакет</th>
                    <th className="px-5 py-3 font-medium">Води</th>
                    <th className="px-5 py-3 font-medium">Парите</th>
                    <th className="px-5 py-3 text-right font-medium">Сума</th>
                  </tr>
                </thead>
                <tbody>
                  {f.sponsors.rows.map((s) => (
                    <tr key={s.id} className="border-b border-bh-ink/8 last:border-0">
                      <td className="px-5 py-3 font-medium text-bh-ink">{s.label}</td>
                      <td className="px-5 py-3 text-bh-ink/70">{TIERS.find((t) => t.id === s.tier)?.label ?? "-"}</td>
                      <td className="px-5 py-3 text-bh-ink/70">{s.owner ?? "-"}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${
                          s.money === "paid" ? STATUS_TONE.paid : s.money === "invoiced" ? STATUS_TONE.invoiced : STATUS_TONE.planned
                        }`}>
                          {MONEY.find((m) => m.id === s.money)?.label ?? "договорено"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-bh-ink"><Eur cents={s.amountCents} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Expenses by category, against budget */}
        <section className="mt-12">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Разходи по категория</h2>
          <p className="mt-1 text-sm text-bh-ink/55">
            Планирано е всичко, което не е отменено; поето е фактурираното и платеното. Бюджетът се вписва тук.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl bg-bh-cloud ring-1 ring-bh-ink/8">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead>
                <tr className="border-b border-bh-ink/10 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/50">
                  <th className="px-5 py-3 font-medium">Категория</th>
                  <th className="px-5 py-3 text-right font-medium">Планирано</th>
                  <th className="px-5 py-3 text-right font-medium">Поето</th>
                  <th className="px-5 py-3 text-right font-medium">Бюджет</th>
                  <th className="px-5 py-3 font-medium">Спрямо бюджета</th>
                </tr>
              </thead>
              <tbody>
                {f.expenses.byCategory.map((c) => {
                  const over = c.budgetCents !== null && c.plannedCents > c.budgetCents;
                  const pct = c.budgetCents ? Math.round((c.plannedCents / c.budgetCents) * 100) : null;
                  return (
                    <tr key={c.id} className="border-b border-bh-ink/8 last:border-0">
                      <td className="px-5 py-3 font-medium text-bh-ink">{c.label}</td>
                      <td className="px-5 py-3 text-right text-bh-ink"><Eur cents={c.plannedCents} /></td>
                      <td className="px-5 py-3 text-right text-bh-ink/70"><Eur cents={c.committedCents} /></td>
                      <td className="px-5 py-3 text-right"><BudgetForm category={c.id} amountCents={c.budgetCents} /></td>
                      <td className="px-5 py-3">
                        {pct === null ? (
                          <span className="text-xs text-bh-ink/40">няма бюджет</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-28 overflow-hidden rounded-full bg-bh-ink/10">
                              <div className={`h-full ${over ? "bg-[#C4607F]" : "bg-[#0E8C7D]"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className={`text-xs font-semibold ${over ? "text-[#9c3d5c]" : "text-bh-ink/60"}`}>{pct}%</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-bh-ink/[0.04] font-semibold">
                  <td className="px-5 py-3 text-bh-ink">Общо</td>
                  <td className="px-5 py-3 text-right text-bh-ink"><Eur cents={f.expenses.plannedCents} /></td>
                  <td className="px-5 py-3 text-right text-bh-ink/70"><Eur cents={f.expenses.committedCents} /></td>
                  <td className="px-5 py-3 text-right text-bh-ink"><Eur cents={f.expenses.budgetCents} /></td>
                  <td className="px-5 py-3 text-xs text-bh-ink/55">платено <Eur cents={f.expenses.paidCents} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* The ledger */}
        <section className="mt-12">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Дневник на разходите</h2>
          <div className="mt-4 rounded-2xl bg-bh-cloud p-5 ring-1 ring-bh-ink/8">
            <ExpenseForm />
          </div>
          <div className="mt-4 overflow-x-auto rounded-2xl bg-bh-cloud ring-1 ring-bh-ink/8">
            {f.expenses.rows.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-bh-ink/55">Още няма разходи. Първият ред отива по-горе.</p>
            ) : (
              <table className="w-full min-w-[52rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-bh-ink/10 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/50">
                    <th className="px-5 py-3 font-medium">Дата</th>
                    <th className="px-5 py-3 font-medium">Категория</th>
                    <th className="px-5 py-3 font-medium">Доставчик · за какво</th>
                    <th className="px-5 py-3 font-medium">Фактура</th>
                    <th className="px-5 py-3 font-medium">Статус</th>
                    <th className="px-5 py-3 text-right font-medium">Сума</th>
                  </tr>
                </thead>
                <tbody>
                  {f.expenses.rows.map((e) => (
                    <ExpenseRow key={e.id} e={e} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
