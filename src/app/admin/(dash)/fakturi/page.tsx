import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";

import { ResendForm } from "./ResendForm";
import { INVOICE_SERIES_START } from "@/lib/company";
import { listInvoices } from "@/lib/invoices";
import { formatPrice } from "@/lib/tickets";
import { HomeLink } from "@/components/admin/HomeLink";

export const dynamic = "force-dynamic";

function bgDate(d: Date | null): string {
  if (!d) return "-";
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export default async function InvoicesPage() {
  // The layout also checks, but a layout is not an auth boundary - the
  // Next docs are explicit that it may be skipped on RSC navigations.
  if (!(await isAdmin())) redirect("/admin/login");

  const rows = await listInvoices();

  return (
    <div className="min-h-screen rounded-[1.75rem] bg-bh-paper px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">
              Админ
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">
              Фактури
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Plain anchors: one is a file download, the other opens a
                print view - neither wants client-side navigation. */}
            <a
              href="/admin/fakturi/eksport"
              className="rounded-full border border-bh-ink/20 px-4 py-2 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink"
            >
              Експорт CSV
            </a>
            <a
              href="/admin/fakturi/pechat"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-bh-ink/20 px-4 py-2 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink"
            >
              Всички за печат (PDF)
            </a>
            <HomeLink />
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bh-ink/60">
          Номерата идват от собствената поредица на сайта, започваща от{" "}
          <span className="font-mono">{INVOICE_SERIES_START}</span>. Издават се
          само на платена поръчка, така че поредицата няма дупки.
        </p>

        {rows.length === 0 ? (
          <p className="mt-10 rounded-2xl bg-bh-cloud px-6 py-8 text-center text-sm text-bh-ink/55 ring-1 ring-bh-ink/8">
            Още няма издадени фактури.
          </p>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="text-left font-mono text-[0.62rem] uppercase tracking-[0.15em] text-bh-ink/45">
                  <th className="py-3 font-normal">№</th>
                  <th className="py-3 font-normal">Дата</th>
                  <th className="py-3 font-normal">Получател</th>
                  <th className="py-3 text-right font-normal">Сума</th>
                  <th className="py-3 font-normal">Действия</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.reference}
                    className="border-t border-bh-ink/8 align-middle"
                  >
                    <td className="py-3 pr-4 font-mono tabular-nums text-bh-ink">
                      {String(r.number).padStart(10, "0")}
                      <span className="block text-[0.65rem] text-bh-ink/40">
                        {r.reference}
                      </span>
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-bh-ink/70">
                      {bgDate(r.issuedAt)}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-medium text-bh-ink">
                        {r.company ?? r.name}
                      </span>
                      <span className="block text-xs text-bh-ink/50">
                        {r.email}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-bh-ink">
                      {formatPrice(r.totalCents)} €
                      {r.refundedCents ? (
                        <span className="block text-[0.65rem] font-semibold uppercase tracking-wide text-[#9c3d5c]">
                          {r.status === "refunded" ? "върната" : `върнати ${formatPrice(r.refundedCents)} €`}
                          {r.creditNoteNumber ? (
                            <a
                              href={`/faktura/${r.reference}/kredit`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 underline underline-offset-2"
                            >
                              КИ № {String(r.creditNoteNumber).padStart(10, "0")}
                            </a>
                          ) : (
                            " · очаква кредитно известие"
                          )}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href={`/faktura/${r.reference}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-bh-pine px-3 py-1.5 text-xs font-semibold text-bh-paper"
                        >
                          Отвори
                        </a>
                        <ResendForm reference={r.reference} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
