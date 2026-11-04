import { OFFER, listOfferRecipients } from "@/lib/abandoned-offer";
import { abandonedOfferLetter } from "@/lib/sequence-letters";

import { OfferSendForm, OfferTestForm } from "./Forms";

const bgWhen = (d: Date) =>
  d.toLocaleString("bg-BG", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" });

/**
 * The last-week offer to everyone who opened a checkout and never paid:
 * who is on the list, who already has the letter, the wording as the reader
 * sees it, and the buttons. Sent by hand, once per address.
 */
export async function AbandonedOfferSection() {
  const people = await listOfferRecipients();
  const waiting = people.filter((p) => !p.sent);
  const sample = abandonedOfferLetter({ name: "Мария", items: "1× PLUS", tierId: "plus", code: OFFER.code, percent: OFFER.percent, unsubUrl: "#" });

  return (
    <section id="abandoned-offer" className="mt-10 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
      <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold tracking-tight text-bh-ink">
        -{OFFER.percent}% за недовършените поръчки
        <span className="rounded-full bg-[#d0a11a]/20 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-[#7a5b00]">на ръка</span>
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bh-ink/60">
        До всеки, който е започнал поръчка с карта и не я е платил, без тези, които после са купили или са се отписали. Едно писмо на адрес, с код{" "}
        <span className="font-mono font-semibold text-bh-ink">{OFFER.code}</span> за -{OFFER.percent}% на всички билети до {bgWhen(OFFER.until)} (полунощ след 4 ноември). Кодът се прави сам при първото пращане и се вижда в Промо кодове.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-bh-paper p-5 ring-1 ring-bh-ink/8">
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">Чакат писмото</div>
              <div className="mt-2 text-3xl font-black tracking-tight text-bh-ink">{waiting.length}</div>
              <div className="mt-1 text-xs text-bh-ink/55">{people.length - waiting.length} вече са го получили</div>
            </div>
            <div className="rounded-2xl bg-bh-paper p-5 ring-1 ring-bh-ink/8">
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">Първо го прочети в пощата си</div>
              <div className="mt-3"><OfferTestForm /></div>
            </div>
          </div>
          <div className="mt-4"><OfferSendForm count={waiting.length} /></div>
          {people.length > 0 && (
            <ul className="mt-5 max-h-72 overflow-y-auto rounded-2xl bg-bh-paper p-4 text-xs ring-1 ring-bh-ink/8">
              {people.map((p) => (
                <li key={p.email} className="flex flex-wrap justify-between gap-x-3 border-t border-bh-ink/6 py-1.5 first:border-t-0">
                  <span className="text-bh-ink">{p.name} <span className="text-bh-ink/50">{p.email}</span></span>
                  <span className="text-bh-ink/55">{p.items}{p.sent ? " · изпратено" : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="overflow-hidden rounded-2xl ring-1 ring-bh-ink/8">
          <iframe title="Писмото" srcDoc={sample.html} className="h-[34rem] w-full bg-[#f1f5f3]" sandbox="" />
        </div>
      </div>
    </section>
  );
}
