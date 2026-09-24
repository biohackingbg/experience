import type { Metadata } from "next";
import Link from "next/link";

import { HomeLink } from "@/components/admin/HomeLink";
import { invoiceNo } from "@/components/InvoiceDocument";
import { requireAccess } from "@/lib/access";
import { listDocuments, listPartnersForDocuments } from "@/lib/documents";
import { formatPrice } from "@/lib/tickets";

import { cancelDoc, payDoc } from "./actions";
import { DocumentForm, SendButton } from "./Forms";

export const metadata: Metadata = {
  title: "Проформи и фактури | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const bgDate = (d: Date | null) =>
  d ? d.toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", timeZone: "Europe/Sofia" }) : "-";

/** Everything invoiced that is not a ticket: sponsorship, fees, services. */
export default async function DocumentsPage() {
  await requireAccess("dokumenti");
  const [docs, partners] = await Promise.all([listDocuments(), listPartnersForDocuments()]);
  const open = docs.filter((d) => d.status === "open");

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 font-display text-3xl font-[900] uppercase tracking-tight text-bh-ink">Проформи и фактури</h1>
          </div>
          <HomeLink />
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-bh-ink/60">
          За всичко, което не е билет: спонсорски пакет, такса за работилница, услуга. Първо излиза{" "}
          <strong className="font-semibold text-bh-ink">проформа</strong> - тя не е данъчен документ и я пращаш на партньора.
          Когато преводът дойде, натискаш „Платена“ и се издава{" "}
          <strong className="font-semibold text-bh-ink">фактурата</strong>, с номер от същата поредица като фактурите за
          билети. Сумите се пишат <strong className="font-semibold text-bh-ink">без ДДС</strong>, както са договорени в
          „Презентация“; ДДС-то се добавя отгоре.
        </p>

        <section className="mt-8 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Нова проформа</h2>
          <div className="mt-4">
            <DocumentForm partners={partners} />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight text-bh-ink">Издадени</h2>
            {open.length > 0 && <span className="text-xs text-bh-ink/55">{open.length} чакат плащане</span>}
          </div>
          {docs.length === 0 ? (
            <p className="mt-3 text-sm text-bh-ink/55">Още няма нито една. Първата се прави отгоре.</p>
          ) : (
            <ul className="mt-3 divide-y divide-bh-ink/8">
              {docs.map((d) => (
                <li key={d.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0 text-sm">
                    <span className="font-mono text-xs text-bh-ink/60">{d.reference}</span>
                    <span className="ml-2 font-medium text-bh-ink">{d.company ?? d.buyerName}</span>
                    {d.company && <span className="ml-1 text-xs text-bh-ink/55">· {d.buyerName}</span>}
                    <span
                      className={`ml-2 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide ${
                        d.status === "cancelled"
                          ? "bg-bh-ink/10 text-bh-ink/50 line-through"
                          : d.status === "paid"
                            ? "bg-[#0E8C7D]/15 text-[#0b6d61]"
                            : "bg-[#d0a11a]/20 text-[#7a5b00]"
                      }`}
                    >
                      {d.status === "cancelled" ? "отказана" : d.status === "paid" ? `фактура № ${invoiceNo(d.invoiceNumber ?? 0)}` : "проформа"}
                    </span>
                    <div className="text-xs text-bh-ink/60">
                      {d.items} · {formatPrice(d.totalCents)} € с ДДС · {d.buyerEmail} · създадена {bgDate(d.createdAt)}
                      {d.status === "open" && d.dueAt && (
                        <span className={d.overdue ? " font-semibold text-[#9c3d5c]" : ""}>
                          {" "}
                          · плащане до {bgDate(d.dueAt)}
                          {d.overdue ? " (изтекъл)" : ""}
                        </span>
                      )}
                      {d.note && <span> · {d.note}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/proforma/${d.reference}`}
                      target="_blank"
                      className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink"
                    >
                      Проформа
                    </Link>
                    {d.invoiceNumber && (
                      <Link
                        href={`/faktura/${d.reference}`}
                        target="_blank"
                        className="rounded-full bg-bh-pine px-3 py-1.5 text-xs font-semibold text-bh-paper"
                      >
                        Фактура
                      </Link>
                    )}
                    {d.status !== "cancelled" && <SendButton reference={d.reference} kind="proforma" label="Изпрати проформа" />}
                    {d.invoiceNumber && <SendButton reference={d.reference} kind="invoice" label="Изпрати фактура" />}
                    {d.status === "open" && (
                      <>
                        <form action={payDoc}>
                          <input type="hidden" name="reference" value={d.reference} />
                          <button type="submit" className="rounded-full bg-[#146455] px-3.5 py-1.5 text-xs font-semibold text-white">
                            Платена
                          </button>
                        </form>
                        <form action={cancelDoc}>
                          <input type="hidden" name="reference" value={d.reference} />
                          <button type="submit" className="rounded-full px-3 py-1.5 text-xs font-semibold text-bh-ink/50 hover:text-red-600">
                            Откажи
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
