import { COMPANY } from "@/lib/company";
import type { Lang } from "@/lib/i18n";
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
 * The wording of both documents, in both languages.
 *
 * The English version is bilingual rather than English-only: Bulgarian
 * accounting law wants the document readable in Bulgarian, a foreign
 * accountant wants it readable at all. Each label carries the English
 * first and the Bulgarian after it, so one sheet satisfies both desks.
 */
const T = {
  invoice: ["Фактура", "Invoice"],
  creditNote: ["Кредитно известие", "Credit note"],
  toInvoice: ["към фактура №", "to invoice no."],
  of: ["от", "of"],
  issued: ["Дата на издаване", "Date of issue"],
  taxEvent: ["Дата на данъчно събитие", "Date of tax event"],
  order: ["Поръчка", "Order"],
  supplier: ["Доставчик", "Supplier"],
  recipient: ["Получател", "Recipient"],
  eik: ["ЕИК", "Company ID (EIK)"],
  vatNo: ["ДДС №", "VAT no."],
  eikOrVat: ["ЕИК / ДДС №", "Company ID / VAT no."],
  manager: ["Управител", "Managing director"],
  contact: ["Лице за контакт", "Contact"],
  item: ["Наименование", "Description"],
  unit: ["Ед. цена", "Unit price"],
  qty: ["Кол.", "Qty"],
  amount: ["Стойност", "Amount"],
  ticket: ["Билет за Sofia Life Summit", "Ticket for Sofia Life Summit"],
  venue: ["07-08 ноември 2026, Гранд Хотел Милениум, София", "7-8 November 2026, Grand Hotel Millennium, Sofia"],
  discount: ["Отстъпка", "Discount"],
  code: ["код", "code"],
  base: ["Данъчна основа", "Taxable amount"],
  vat: ["ДДС", "VAT"],
  total: ["Общо за плащане", "Total due"],
  totalNote: ["Общо", "Total"],
  payment: ["Начин на плащане: банкова карта през Stripe · Платена на", "Payment: bank card via Stripe · Paid on"],
  paymentBank: ["Начин на плащане: банков превод · Платена на", "Payment: bank transfer · Paid on"],
  issuedBy: ["Съставил", "Issued by"],
  electronic: [
    "Документът е издаден по електронен път и е валиден без подпис и печат.",
    "This document was issued electronically and is valid without signature or stamp.",
  ],
  reason: [
    "Основание: връщане на платената сума - отказ от поръчката. Сумата е възстановена по картата на купувача.",
    "Reason: refund of the amount paid - order cancelled. The amount was returned to the buyer's card.",
  ],
} as const;

type Key = keyof typeof T;

/** A label: Bulgarian alone, or "English / Български" on the bilingual sheet. */
function label(lang: Lang, k: Key): string {
  const [bg, en] = T[k];
  return lang === "en" ? `${en} / ${bg}` : bg;
}

/** A sentence: one language per line, so the footer stays readable. */
function Sentence({ lang, k }: { lang: Lang; k: Key }) {
  const [bg, en] = T[k];
  if (lang !== "en") return <>{bg}</>;
  return (
    <>
      {en}
      <br />
      <span className="text-bh-ink/45">{bg}</span>
    </>
  );
}

function Parties({ inv, lang, dim }: { inv: InvoiceData; lang: Lang; dim: string }) {
  const buyerIsCompany = Boolean(inv.company);
  return (
    <div className="grid gap-8 py-8 sm:grid-cols-2">
      <section>
        <h2 className={`font-mono text-[0.65rem] uppercase tracking-[0.2em] ${dim}`}>{label(lang, "supplier")}</h2>
        <p className="mt-3 font-semibold">{COMPANY.name}</p>
        <p className="mt-1 text-sm leading-relaxed text-bh-ink/70">
          {COMPANY.address}
          <br />
          {label(lang, "eik")}: {COMPANY.eik}
          <br />
          {label(lang, "vatNo")}: {COMPANY.vatNumber}
          <br />
          {label(lang, "manager")}: {COMPANY.manager}
        </p>
      </section>

      <section>
        <h2 className={`font-mono text-[0.65rem] uppercase tracking-[0.2em] ${dim}`}>{label(lang, "recipient")}</h2>
        <p className="mt-3 font-semibold">{inv.company ?? inv.buyerName}</p>
        <p className="mt-1 text-sm leading-relaxed text-bh-ink/70">
          {buyerIsCompany && (
            <>
              {label(lang, "contact")}: {inv.buyerName}
              <br />
            </>
          )}
          {inv.vatNumber && (
            <>
              {label(lang, "eikOrVat")}: {inv.vatNumber}
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
  );
}

function Lines({ inv, lang, dim, sign }: { inv: InvoiceData; lang: Lang; dim: string; sign: "" | "-" }) {
  const vatPercent = inv.vatRateBp / 100;
  return (
    <>
      <table className="w-full border-t border-bh-ink/15 text-sm">
        <thead>
          <tr className={`text-left font-mono text-[0.65rem] uppercase tracking-[0.15em] ${dim}`}>
            <th className="py-3 font-normal">{label(lang, "item")}</th>
            <th className="py-3 text-right font-normal">{label(lang, "unit")}</th>
            <th className="py-3 text-right font-normal">{label(lang, "qty")}</th>
            <th className="py-3 text-right font-normal">{label(lang, "amount")}</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((item) => (
            <tr key={item.tierName} className="border-t border-bh-ink/8 align-top">
              <td className="py-3 pr-4">
                {label(lang, "ticket")} - {item.tierName}
                <span className="block text-xs text-bh-ink/50">{label(lang, "venue")}</span>
              </td>
              <td className="py-3 text-right tabular-nums">{formatPrice(item.unitPriceCents)}</td>
              <td className="py-3 text-right tabular-nums">
                {sign}
                {item.quantity}
              </td>
              <td className="py-3 text-right tabular-nums">
                {sign}
                {formatPrice(item.unitPriceCents * item.quantity)}
              </td>
            </tr>
          ))}
          {inv.discountCents > 0 && (
            <tr className="border-t border-bh-ink/8">
              <td className="py-3 pr-4" colSpan={3}>
                {label(lang, "discount")}
                {inv.promoCode ? ` (${label(lang, "code")} ${inv.promoCode})` : ""}
              </td>
              <td className="py-3 text-right tabular-nums">
                {sign ? "" : "-"}
                {formatPrice(inv.discountCents)}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end border-t border-bh-ink/15 pt-6">
        <dl className="w-full max-w-xs text-sm">
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-bh-ink/60">{label(lang, "base")}</dt>
            <dd className="whitespace-nowrap tabular-nums">
              {sign}
              {formatPrice(inv.subtotalCents)} {inv.currency}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-bh-ink/60">
              {label(lang, "vat")} {vatPercent}%
            </dt>
            <dd className="whitespace-nowrap tabular-nums">
              {sign}
              {formatPrice(inv.vatCents)} {inv.currency}
            </dd>
          </div>
          <div className="mt-2 flex justify-between gap-4 border-t border-bh-ink/15 pt-3 text-base font-bold">
            <dt>{label(lang, sign ? "totalNote" : "total")}</dt>
            <dd className="whitespace-nowrap tabular-nums">
              {sign}
              {formatPrice(inv.totalCents)} {inv.currency}
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
}

/**
 * The invoice itself - one document, no chrome. Used by the buyer's page and
 * by the admin's print-everything page, so the two can never drift apart.
 */
export function InvoiceDocument({ inv, lang = "bg" }: { inv: InvoiceData; lang?: Lang }) {
  const dim = "text-bh-ink/45";
  return (
    <article className="rounded-3xl p-8 ring-1 ring-bh-ink/10 sm:p-10 print:rounded-none print:p-0 print:ring-0">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-bh-ink/15 pb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">{label(lang, "invoice")}</h1>
          <p className="mt-1 font-mono text-sm text-bh-ink/60">№ {invoiceNo(inv.number)}</p>
        </div>
        <dl className="text-right text-sm">
          <div className="flex justify-end gap-3">
            <dt className={dim}>{label(lang, "issued")}</dt>
            <dd className="font-medium">{bgDate(inv.issuedAt)}</dd>
          </div>
          <div className="mt-1 flex justify-end gap-3">
            <dt className={dim}>{label(lang, "taxEvent")}</dt>
            <dd className="font-medium">{bgDate(inv.issuedAt)}</dd>
          </div>
          <div className="mt-1 flex justify-end gap-3">
            <dt className={dim}>{label(lang, "order")}</dt>
            <dd className="font-mono font-medium">{inv.reference}</dd>
          </div>
        </dl>
      </header>

      <Parties inv={inv} lang={lang} dim={dim} />
      <Lines inv={inv} lang={lang} dim={dim} sign="" />

      <footer className="mt-8 border-t border-bh-ink/15 pt-6 text-xs leading-relaxed text-bh-ink/55">
        <p>
          {label(lang, inv.paymentMethod === "bank" ? "paymentBank" : "payment")} {bgDate(inv.issuedAt)}.
        </p>
        <p className="mt-2">
          {label(lang, "issuedBy")}: {COMPANY.manager}
        </p>
        <p className="mt-3">
          <Sentence lang={lang} k="electronic" />
        </p>
      </footer>
    </article>
  );
}

/**
 * The credit note that answers a refunded invoice: same parties, the same
 * lines with reversed signs, numbered from the same run as the invoices.
 */
export function CreditNoteDocument({ inv, lang = "bg" }: { inv: InvoiceData; lang?: Lang }) {
  const dim = "text-bh-ink/65";
  const noteDate = inv.creditNotedAt ?? inv.issuedAt;

  return (
    <article className="rounded-3xl p-8 ring-1 ring-bh-ink/10 sm:p-10 print:rounded-none print:p-0 print:ring-0">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-bh-ink/15 pb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">{label(lang, "creditNote")}</h1>
          <p className="mt-1 font-mono text-sm text-bh-ink/70">№ {invoiceNo(inv.creditNoteNumber ?? 0)}</p>
          <p className="mt-2 text-sm text-bh-ink/70">
            {label(lang, "toInvoice")} {invoiceNo(inv.number)} {label(lang, "of")} {bgDate(inv.issuedAt)}
          </p>
        </div>
        <dl className="text-right text-sm">
          <div className="flex justify-end gap-3">
            <dt className="text-bh-ink/70">{label(lang, "issued")}</dt>
            <dd className="font-medium">{bgDate(noteDate)}</dd>
          </div>
          <div className="mt-1 flex justify-end gap-3">
            <dt className="text-bh-ink/70">{label(lang, "taxEvent")}</dt>
            <dd className="font-medium">{bgDate(noteDate)}</dd>
          </div>
          <div className="mt-1 flex justify-end gap-3">
            <dt className="text-bh-ink/70">{label(lang, "order")}</dt>
            <dd className="font-mono font-medium">{inv.reference}</dd>
          </div>
        </dl>
      </header>

      <Parties inv={inv} lang={lang} dim={dim} />
      <Lines inv={inv} lang={lang} dim={dim} sign="-" />

      <footer className="mt-8 border-t border-bh-ink/15 pt-6 text-xs leading-relaxed text-bh-ink/70">
        <p>
          <Sentence lang={lang} k="reason" />
        </p>
        <p className="mt-2">
          {label(lang, "issuedBy")}: {COMPANY.manager}
        </p>
        <p className="mt-3">
          <Sentence lang={lang} k="electronic" />
        </p>
      </footer>
    </article>
  );
}
