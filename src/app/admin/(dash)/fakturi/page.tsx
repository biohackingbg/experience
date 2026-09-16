import Link from "next/link";

import { requireAccess } from "@/lib/access";

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

/** YYYY-MM-DD or nothing - a malformed date is ignored, not guessed at. */
const day = (v: string | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ ot?: string; do?: string }>;
}) {
  // The layout also checks, but a layout is not an auth boundary - the
  // Next docs are explicit that it may be skipped on RSC navigations.
  await requireAccess("fakturi");

  const sp = await searchParams;
  const from = day(sp.ot);
  const to = day(sp.do);
  const rows = await listInvoices({ from, to });

  // Whatever is on screen is what the export and the print sheet carry.
  const qs = new URLSearchParams({ ...(from ? { ot: from } : {}), ...(to ? { do: to } : {}) }).toString();
  const withRange = (path: string) => (qs ? `${path}?${qs}` : path);

  // The accountant asks by month, so the two usual months are one click.
  const todayInSofia = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(new Date());
  const [year, month] = todayInSofia.split("-").map(Number);
  const firstDay = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const months = [
    { label: "този месец", from: firstDay(year, month), to: lastDay(year, month) },
    { label: "миналия месец", from: firstDay(prevYear, prevMonth), to: lastDay(prevYear, prevMonth) },
  ];

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
                print view - neither wants client-side navigation. Both carry
                the period on screen, so the accountant gets exactly that. */}
            <a
              href={withRange("/admin/fakturi/eksport")}
              className="rounded-full border border-bh-ink/20 px-4 py-2 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink"
            >
              Експорт CSV
            </a>
            <a
              href={withRange("/admin/fakturi/pechat")}
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
          само на платена поръчка, така че поредицата няма дупки. Тук са и
          фактурите за спонсорство и услуги - те са в същата поредица.
        </p>

        {/* A plain GET form: the chosen period lands in the address, so it
            survives a refresh and can be sent to someone as a link. */}
        <form method="get" className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl bg-bh-cloud p-4 ring-1 ring-bh-ink/8">
          <label className="text-xs text-bh-ink/60">
            От
            <input
              type="date"
              name="ot"
              defaultValue={from ?? ""}
              className="mt-1 block rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink"
            />
          </label>
          <label className="text-xs text-bh-ink/60">
            До
            <input
              type="date"
              name="do"
              defaultValue={to ?? ""}
              className="mt-1 block rounded-xl border border-bh-ink/15 bg-bh-paper px-3 py-2 text-sm text-bh-ink"
            />
          </label>
          <button type="submit" className="rounded-full bg-bh-ink px-4 py-2 text-xs font-semibold text-bh-paper">
            Покажи
          </button>
          {months.map((m) => (
            <Link
              key={m.label}
              href={`/admin/fakturi?ot=${m.from}&do=${m.to}`}
              className="rounded-full border border-bh-ink/20 px-3 py-2 text-xs font-semibold text-bh-ink transition-colors hover:border-bh-ink"
            >
              {m.label}
            </Link>
          ))}
          {(from || to) && (
            <Link href="/admin/fakturi" className="px-2 py-2 text-xs font-semibold text-bh-ink/55 underline underline-offset-2">
              всички
            </Link>
          )}
          <span className="ml-auto text-xs text-bh-ink/55">
            {rows.length} {rows.length === 1 ? "фактура" : "фактури"}
            {from || to ? " в периода" : " общо"}
          </span>
        </form>

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
                      {r.isDocument && (
                        <span className="ml-2 rounded-full bg-bh-ink/8 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-bh-ink/60">
                          спонсорство / услуга
                        </span>
                      )}
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
                        {/* Resending means resending the ticket mail; a
                            sponsorship invoice has no tickets behind it. */}
                        {!r.isDocument && <ResendForm reference={r.reference} />}
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
