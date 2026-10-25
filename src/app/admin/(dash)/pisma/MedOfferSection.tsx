import { getMedOffer, renderMedLetter, sentTo } from "@/lib/med-offer";

import { removeMedRecipient } from "./actions";
import { MedAddForm, MedSendForm, MedTestForm, MedTextForm } from "./MedOfferForms";

/**
 * The offer to people who bought a ticket for the medical conference and
 * cannot go: who is on the list, who has had it, the wording as the reader
 * sees it, and the buttons. Anyone added later gets the same letter on the
 * next press; nobody gets it twice.
 */
export async function MedOfferSection() {
  const offer = await getMedOffer();
  const done = await sentTo();
  const waiting = offer.recipients.filter((r) => !done.has(r.email)).length;
  const sample = await renderMedLetter(offer, offer.recipients[0] ?? { name: "Мария Иванова", email: "primer@example.com" });

  return (
    <section id="med-offer" className="mt-10 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
      <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold tracking-tight text-bh-ink">
        Писмо до купилите билет за медицинската конференция
        <span className="rounded-full bg-[#d0a11a]/20 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-[#7a5b00]">на ръка</span>
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bh-ink/60">
        За хората, които не са лекари и не могат да отидат, и пренасочват 50 €: два билета CORE срещу тях или доплащане към PLUS и PEAK.
        Не се праща само. Натискаш „Прати“, когато си готова, и писмото тръгва само до тези, които още не са го получили.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">Получатели · {offer.recipients.length}</div>
          {offer.recipients.length === 0 ? (
            <p className="mt-3 text-sm text-bh-ink/55">Още няма никого. Добави ги отдолу.</p>
          ) : (
            <ul className="mt-3 flex flex-col divide-y divide-bh-ink/6 rounded-2xl bg-bh-paper ring-1 ring-bh-ink/8">
              {offer.recipients.map((r) => (
                <li key={r.email} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium text-bh-ink">{r.name}</span>
                    <span className="ml-2 break-all text-xs text-bh-ink/50">{r.email}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    {done.has(r.email) ? (
                      <span className="rounded-full bg-[#0E8C7D]/15 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-[#0b6d61]">изпратено</span>
                    ) : (
                      <>
                        <span className="text-[0.65rem] text-bh-ink/40">чака</span>
                        <form action={removeMedRecipient}>
                          <input type="hidden" name="email" value={r.email} />
                          <button type="submit" className="text-xs text-bh-ink/45 underline hover:text-bh-ink">махни</button>
                        </form>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5">
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">Добави хора</div>
            <div className="mt-2"><MedAddForm /></div>
          </div>
          <div className="mt-6 rounded-2xl bg-bh-paper p-5 ring-1 ring-bh-ink/8">
            <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">Първо го прочети в пощата си</div>
            <div className="mt-3"><MedTestForm /></div>
          </div>
          <div className="mt-6"><MedSendForm waiting={waiting} /></div>
        </div>

        <div>
          <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">Така го вижда първият от списъка</div>
          <iframe title="Превю на писмото" srcDoc={sample.html} sandbox="" className="mt-3 h-[44rem] w-full rounded-2xl bg-[#f2f2ee] ring-1 ring-bh-ink/8" />
        </div>
      </div>

      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-semibold text-bh-ink">Промени тема и текст</summary>
        <div className="mt-3"><MedTextForm subject={offer.subject} body={offer.body} /></div>
      </details>
    </section>
  );
}
