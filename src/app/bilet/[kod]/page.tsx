import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { Calendar, Pin, TicketIcon } from "@/components/ui/Pictograms";
import { TICKET_PAGE } from "@/lib/i18n";
import { findTicket } from "@/lib/tickets-lookup";

import { AttendeeForm } from "./AttendeeForm";

export const metadata: Metadata = {
  title: "Твоят билет | Sofia Life Summit 2026",
  // The code is the only thing guarding this page, so keep it out of search.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ kod: string }>;
}) {
  const { kod } = await params;
  const ticket = await findTicket(decodeURIComponent(kod));

  if (!ticket) notFound();
  const t = TICKET_PAGE[ticket.lang];

  // Rendered as an SVG string rather than a canvas so it prints crisply and
  // needs no client JavaScript.
  const qr = await QRCode.toString(ticket.code, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#02251f", light: "#0000" },
  });

  return (
    <div className="flex min-h-screen items-center justify-center rounded-[1.75rem] bg-bh-paper px-5 py-12 print:bg-white print:p-0">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-3xl bg-bh-cloud ring-1 ring-bh-ink/10 print:ring-0">
          <div className="bh-mint px-7 py-6">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-bh-ink/50">
              {t.ticketFor}
            </p>
            <h1 className="mt-2 font-display text-2xl font-[900] uppercase leading-none tracking-tight text-bh-ink">
              Sofia Life Summit
            </h1>
            <p className="mt-2 text-sm text-bh-ink/70">{ticket.tierName}</p>
          </div>

          <div className="flex justify-center px-7 py-8">
            <div
              className="h-52 w-52 [&>svg]:h-full [&>svg]:w-full"
              // Generated from the ticket code by the QR library - no user input.
              dangerouslySetInnerHTML={{ __html: qr }}
              aria-hidden
            />
          </div>

          <p className="px-7 text-center font-mono text-2xl font-semibold tracking-[0.15em] text-bh-ink">
            {ticket.code}
          </p>
          <p className="mt-2 px-7 text-center text-xs text-bh-ink/50">
            {t.show}
          </p>

          <dl className="mt-7 divide-y divide-bh-ink/8 border-t border-bh-ink/8 text-sm">
            <div className="flex items-center gap-4 px-7 py-4">
              <Calendar className="h-5 w-5 shrink-0 text-bh-pine" />
              <div>
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bh-ink/45">
                  {t.when}
                </dt>
                <dd className="mt-0.5 font-medium text-bh-ink">
                  {t.dates}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-4 px-7 py-4">
              <Pin className="h-5 w-5 shrink-0 text-bh-pine" />
              <div>
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bh-ink/45">
                  {t.where}
                </dt>
                <dd className="mt-0.5 font-medium text-bh-ink">
                  {t.venue}
                </dd>
              </div>
            </div>
            {ticket.attendeeName && (
              <div className="flex items-center gap-4 px-7 py-4">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bh-pine text-[0.6rem] font-bold text-white">
                  {ticket.attendeeName.charAt(0).toUpperCase()}
                </span>
                <div>
                  <dt className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bh-ink/45">
                    {t.attendee}
                  </dt>
                  <dd className="mt-0.5 font-medium text-bh-ink">{ticket.attendeeName}</dd>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 px-7 py-4">
              <TicketIcon className="h-5 w-5 shrink-0 text-bh-pine" />
              <div>
                <dt className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bh-ink/45">
                  {t.order}
                </dt>
                <dd className="mt-0.5 font-medium text-bh-ink">
                  {ticket.reference} · {ticket.buyerName}
                </dd>
              </div>
            </div>
          </dl>

          {!ticket.checkedInAt && (
            <AttendeeForm code={ticket.code} current={ticket.attendeeName} lang={ticket.lang} />
          )}

          {ticket.checkedInAt && (
            <p className="border-t border-bh-ink/8 bg-amber-100 px-7 py-4 text-center text-sm text-amber-900">
              {t.used}{" "}
              {ticket.checkedInAt.toLocaleString("bg-BG", {
                dateStyle: "short",
                timeStyle: "short",
              })}
              .
            </p>
          )}
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-bh-ink/45 print:hidden">
          {t.keep}
        </p>
      </div>
    </div>
  );
}
