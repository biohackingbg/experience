import { COMPANY } from "@/lib/company";
import type { InvoiceData } from "@/lib/invoices";
import { formatPrice } from "@/lib/tickets";

function bgDate(d: Date): string {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** Ten digits, as the numbering rules require. */
export function invoiceNo(n: number): string {
  return String(n).padStart(10, "0");
}

/**
 * The invoice itself - one document, no chrome. Used by the buyer's page and
 * by the admin's print-everything page, so the two can never drift apart.
 */
export function InvoiceDocument({ inv }: { inv: InvoiceData }) {
  const vatPercent = inv.vatRateBp / 100;
  const buyerIsCompany = Boolean(inv.company);

  return (
<article className="rounded-3xl p-8 ring-1 ring-bh-ink/10 sm:p-10 print:rounded-none print:p-0 print:ring-0">
  <header className="flex flex-wrap items-start justify-between gap-6 border-b border-bh-ink/15 pb-6">
    <div>
      <h1 className="text-2xl font-black uppercase tracking-tight">
        Фактура
      </h1>
      <p className="mt-1 font-mono text-sm text-bh-ink/60">
        № {invoiceNo(inv.number)}
      </p>
    </div>
    <dl className="text-right text-sm">
      <div className="flex justify-end gap-3">
        <dt className="text-bh-ink/50">Дата на издаване</dt>
        <dd className="font-medium">{bgDate(inv.issuedAt)}</dd>
      </div>
      <div className="mt-1 flex justify-end gap-3">
        <dt className="text-bh-ink/50">Дата на данъчно събитие</dt>
        <dd className="font-medium">{bgDate(inv.issuedAt)}</dd>
      </div>
      <div className="mt-1 flex justify-end gap-3">
        <dt className="text-bh-ink/50">Поръчка</dt>
        <dd className="font-mono font-medium">{inv.reference}</dd>
      </div>
    </dl>
  </header>

  <div className="grid gap-8 py-8 sm:grid-cols-2">
    <section>
      <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bh-ink/45">
        Доставчик
      </h2>
      <p className="mt-3 font-semibold">{COMPANY.name}</p>
      <p className="mt-1 text-sm leading-relaxed text-bh-ink/70">
        {COMPANY.address}
        <br />
        ЕИК: {COMPANY.eik}
        <br />
        ДДС №: {COMPANY.vatNumber}
        <br />
        Управител: {COMPANY.manager}
      </p>
    </section>

    <section>
      <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-bh-ink/45">
        Получател
      </h2>
      <p className="mt-3 font-semibold">
        {inv.company ?? inv.buyerName}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-bh-ink/70">
        {buyerIsCompany && (
          <>
            Лице за контакт: {inv.buyerName}
            <br />
          </>
        )}
        {inv.vatNumber && (
          <>
            ЕИК / ДДС №: {inv.vatNumber}
            <br />
          </>
        )}
        {inv.address && (
          <>
            {inv.address}
            <br />
          </>
        )}
        {inv.buyerEmail}
      </p>
    </section>
  </div>

  <table className="w-full border-t border-bh-ink/15 text-sm">
    <thead>
      <tr className="text-left font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/45">
        <th className="py-3 font-normal">Наименование</th>
        <th className="py-3 text-right font-normal">Ед. цена</th>
        <th className="py-3 text-right font-normal">Кол.</th>
        <th className="py-3 text-right font-normal">Стойност</th>
      </tr>
    </thead>
    <tbody>
      {inv.items.map((item) => (
        <tr
          key={item.tierName}
          className="border-t border-bh-ink/8 align-top"
        >
          <td className="py-3 pr-4">
            Билет за Sofia Life Summit - {item.tierName}
            <span className="block text-xs text-bh-ink/50">
              07-08 ноември 2026, Гранд Хотел Милениум, София
            </span>
          </td>
          <td className="py-3 text-right tabular-nums">
            {formatPrice(item.unitPriceCents)}
          </td>
          <td className="py-3 text-right tabular-nums">
            {item.quantity}
          </td>
          <td className="py-3 text-right tabular-nums">
            {formatPrice(item.unitPriceCents * item.quantity)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  <div className="mt-6 flex justify-end border-t border-bh-ink/15 pt-6">
    <dl className="w-full max-w-xs text-sm">
      <div className="flex justify-between py-1">
        <dt className="text-bh-ink/60">Данъчна основа</dt>
        <dd className="tabular-nums">
          {formatPrice(inv.subtotalCents)} {inv.currency}
        </dd>
      </div>
      <div className="flex justify-between py-1">
        <dt className="text-bh-ink/60">ДДС {vatPercent}%</dt>
        <dd className="tabular-nums">
          {formatPrice(inv.vatCents)} {inv.currency}
        </dd>
      </div>
      <div className="mt-2 flex justify-between border-t border-bh-ink/15 pt-3 text-base font-bold">
        <dt>Общо за плащане</dt>
        <dd className="tabular-nums">
          {formatPrice(inv.totalCents)} {inv.currency}
        </dd>
      </div>
    </dl>
  </div>

  <footer className="mt-8 border-t border-bh-ink/15 pt-6 text-xs leading-relaxed text-bh-ink/55">
    <p>
      Начин на плащане: банкова карта през Stripe · Платена на{" "}
      {bgDate(inv.issuedAt)}.
    </p>
    <p className="mt-2">Съставил: {COMPANY.manager}</p>
    <p className="mt-3">
      Документът е издаден по електронен път и е валиден без подпис и
      печат.
    </p>
  </footer>
</article>
  );
}
