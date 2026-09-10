import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

import { Calendar, Pin, TicketIcon } from "@/components/ui/Pictograms";
import { BOOKING, TICKET_PAGE } from "@/lib/i18n";
import { getTicketPlaces, listWorkshops } from "@/lib/workshops";
import { dayLabel } from "@/lib/tickets";
import { findTicket } from "@/lib/tickets-lookup";
import { walletConfigured } from "@/lib/wallet-pass";

import { AttendeeForm } from "./AttendeeForm";
import { Workshops } from "./Workshops";

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
  const [sessions, places] = await Promise.all([listWorkshops(), getTicketPlaces(ticket.code)]);

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
            <p className="mt-2 text-sm text-bh-ink/70">
              {ticket.tierName}
              {dayLabel(ticket.day, ticket.lang) && (
                <>
                  {" · "}
                  <span className="font-semibold text-bh-ink">{dayLabel(ticket.day, ticket.lang)}</span>
                </>
              )}
            </p>
          </div>

          <div className="flex justify-center px-7 py-8">
            {/* Always ink on white, whatever the theme: a scanner needs the
                contrast, and in dark mode the card behind it is nearly the
                colour of the code. */}
            <div className="rounded-2xl bg-white p-4">
              <div
                className="h-48 w-48 [&>svg]:h-full [&>svg]:w-full"
                // Generated from the ticket code by the QR library - no user input.
                dangerouslySetInnerHTML={{ __html: qr }}
                aria-hidden
              />
            </div>
          </div>

          <p className="px-7 text-center font-mono text-2xl font-semibold tracking-[0.15em] text-bh-ink">
            {ticket.code}
          </p>
          <p className="mt-2 px-7 text-center text-xs text-bh-ink/50">
            {t.show}
          </p>

          {walletConfigured() && !ticket.checkedInAt && (
            <div className="mt-5 flex flex-col items-center gap-2 px-7 print:hidden">
              <a
                href={`/api/wallet/${encodeURIComponent(ticket.code)}`}
                className="inline-flex items-center gap-2 rounded-xl bg-bh-ink px-4 py-2.5 text-sm font-semibold text-bh-paper"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="currentColor">
                  <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5V8H3V6.5Zm0 3h18v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-8Zm12 3a1 1 0 0 0 0 2h3a1 1 0 1 0 0-2h-3Z" />
                </svg>
                {t.wallet}
              </a>
              <p className="text-center text-[0.7rem] text-bh-ink/45">{t.walletHint}</p>
            </div>
          )}

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

        {places && (
          <Workshops
            code={ticket.code}
            lang={ticket.lang}
            tierId={places.tierId}
            sessions={sessions.map((w) => ({
              id: w.id,
              kind: w.kind,
              title: (ticket.lang === "en" ? w.titleEn : null) || w.title,
              description: (ticket.lang === "en" ? w.descriptionEn : null) || w.description,
              host: w.host,
              location: w.location,
              day: w.day,
              startsAt: w.startsAt,
              endsAt: w.endsAt,
              left: w.left,
            }))}
            booked={places.bookings.map((b) => b.workshopId)}
            remaining={places.remaining}
          />
        )}

        <p className="mt-5 text-center text-xs leading-relaxed text-bh-ink/45 print:hidden">
          {t.keep}
        </p>
      </div>
    </div>
  );
}
