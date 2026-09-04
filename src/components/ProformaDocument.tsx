import { COMPANY } from "@/lib/company";
import type { Proforma } from "@/lib/manual-orders";
import { formatPrice } from "@/lib/tickets";

const bgDate = (d: Date) => new Intl.DateTimeFormat("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Sofia" }).format(d);

/**
 * A proforma: the same shape as the invoice so the reader knows what to
 * expect, but headed as what it is - a request for payment, not a tax
 * document. The invoice follows once the transfer lands.
 */
export function ProformaDocument({ p }: { p: Proforma }) {
  const vatPercent = p.vatRateBp / 100;
  return (
    <article className="rounded-3xl p-8 ring-1 ring-bh-ink/10 sm:p-10 print:rounded-none print:p-0 print:ring-0">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-bh-ink/15 pb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Проформа фактура</h1>
          <p className="mt-1 font-mono text-sm text-bh-ink/60">№ {p.reference}</p>
          {p.paid && <p className="mt-2 inline-block rounded-full bg-[#0E8C7D]/15 px-3 py-1 text-xs font-semibold text-[#0b6d61]">платена - фактурата е издадена</p>}
        </div>
        <dl className="text-right text-sm">
          <div className="flex justify-end gap-3"><dt className="text-bh-ink/50">Дата</dt><dd className="font-medium">{bgDate(p.createdAt)}</dd></div>
          {p.dueAt && <div className="mt-1 flex justify-end gap-3"><dt className="text-bh-ink/50">Плащане до</dt><dd className="font-medium">{bgDate(p.dueAt)}</dd></div>}
        </dl>
      </header>

      <div className="grid gap-8 py-8 sm:grid-cols-2">
        <section>
          <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bh-ink/45">Доставчик</h2>
          <p className="mt-3 font-semibold">{COMPANY.name}</p>
          <p className="mt-1 text-sm leading-relaxed text-bh-ink/70">{COMPANY.address}<br />ЕИК: {COMPANY.eik}<br />ДДС №: {COMPANY.vatNumber}</p>
        </section>
        <section>
          <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bh-ink/45">Получател</h2>
          <p className="mt-3 font-semibold">{p.company ?? p.buyerName}</p>
          <p className="mt-1 text-sm leading-relaxed text-bh-ink/70">
            {p.company && <>Лице за контакт: {p.buyerName}<br /></>}
            {p.vatNumber && <>ЕИК / ДДС №: {p.vatNumber}<br /></>}
            {p.address && <>{p.address}<br /></>}
            {p.buyerEmail}
          </p>
        </section>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/45">
            <th className="py-3 pr-4 text-left font-normal">Описание</th>
            <th className="py-3 text-right font-normal">Ед. цена</th>
            <th className="py-3 text-right font-normal">Кол.</th>
            <th className="py-3 text-right font-normal">Стойност</th>
          </tr>
        </thead>
        <tbody>
          {p.items.map((it) => (
            <tr key={it.tierName} className="border-t border-bh-ink/8 align-top">
              <td className="py-3 pr-4">Билет за Sofia Life Summit - {it.tierName}<span className="block text-xs text-bh-ink/50">07-08 ноември 2026, Гранд Хотел Милениум, София</span></td>
              <td className="py-3 text-right tabular-nums">{formatPrice(it.unitPriceCents)}</td>
              <td className="py-3 text-right tabular-nums">{it.quantity}</td>
              <td className="py-3 text-right tabular-nums">{formatPrice(it.unitPriceCents * it.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end border-t border-bh-ink/15 pt-6">
        <dl className="w-full max-w-xs text-sm">
          <div className="flex justify-between py-1"><dt className="text-bh-ink/60">Данъчна основа</dt><dd className="tabular-nums">{formatPrice(p.subtotalCents)} {p.currency}</dd></div>
          <div className="flex justify-between py-1"><dt className="text-bh-ink/60">ДДС {vatPercent}%</dt><dd className="tabular-nums">{formatPrice(p.vatCents)} {p.currency}</dd></div>
          <div className="mt-2 flex justify-between border-t border-bh-ink/15 pt-3 text-base font-bold"><dt>Общо за плащане</dt><dd className="tabular-nums">{formatPrice(p.totalCents)} {p.currency}</dd></div>
        </dl>
      </div>

      <section className="mt-8 rounded-2xl bg-bh-cloud p-5 text-sm ring-1 ring-bh-ink/8 print:ring-1">
        <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bh-ink/45">Плащане по банков път</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-[8rem_1fr]">
          <dt className="text-bh-ink/60">Получател</dt><dd className="font-medium">{p.bank.holder || COMPANY.name}</dd>
          <dt className="text-bh-ink/60">IBAN</dt><dd className="font-mono font-medium">{p.bank.iban || "-"}</dd>
          <dt className="text-bh-ink/60">BIC</dt><dd className="font-mono font-medium">{p.bank.bic || "-"}</dd>
          <dt className="text-bh-ink/60">Банка</dt><dd className="font-medium">{p.bank.bank || "-"}</dd>
          <dt className="text-bh-ink/60">Основание</dt><dd className="font-medium">Sofia Life Summit · {p.reference}</dd>
        </dl>
        <p className="mt-3 text-xs text-bh-ink/55">Проформата не е данъчен документ. Фактурата и билетите се изпращат на {p.buyerEmail} след получаване на превода.</p>
      </section>
    </article>
  );
}
