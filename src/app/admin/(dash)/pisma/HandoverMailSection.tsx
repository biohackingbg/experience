import { handoverAudience, handoverPreview } from "@/lib/programme-mail";

import { HandoverSendForm, HandoverTestForm } from "./Forms";

/**
 * The letter to buyers of several tickets: how many still wait for it, the
 * wording as the reader sees it, and the buttons. Sent by hand, once per
 * address, in batches of a hundred.
 */
export async function HandoverMailSection() {
  const [audience, preview] = await Promise.all([handoverAudience(), handoverPreview()]);

  return (
    <section id="handover-mail" className="mt-10 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
      <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold tracking-tight text-bh-ink">
        Писмо до купилите повече от един билет
        <span className="rounded-full bg-[#d0a11a]/20 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-[#7a5b00]">на ръка</span>
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bh-ink/60">
        До всеки адрес с 2 или повече билета: списък с билетите му и линк за всеки човек. Човекът отваря линка, пише името и имейла си, потвърждава с код и после влиза със своя имейл в приложението, където сам си записва workshops и experiences. Приложението записва само на един билет на профил, затова иначе останалите билети остават незаписани. В момента: {audience.tickets} билета, {audience.unnamed} от тях още без име.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-bh-paper p-5 ring-1 ring-bh-ink/8">
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">Чакат писмото</div>
              <div className="mt-2 text-3xl font-black tracking-tight text-bh-ink">{audience.waiting}</div>
              <div className="mt-1 text-xs text-bh-ink/55">{audience.sent} вече са го получили</div>
            </div>
            <div className="rounded-2xl bg-bh-paper p-5 ring-1 ring-bh-ink/8">
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">Първо го прочети в пощата си</div>
              <div className="mt-3"><HandoverTestForm /></div>
            </div>
          </div>
          <div className="mt-4"><HandoverSendForm count={audience.waiting} /></div>
          <p className="mt-3 text-xs text-bh-ink/55">Тема: {preview.subject}</p>
        </div>
        <div className="overflow-hidden rounded-2xl ring-1 ring-bh-ink/8">
          <iframe title="Писмото до купилите няколко билета" srcDoc={preview.html} className="h-[40rem] w-full bg-[#f1f5f3]" sandbox="" />
        </div>
      </div>
    </section>
  );
}
