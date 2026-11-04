import { programmeAudience, programmePreview } from "@/lib/programme-mail";

import { ProgrammeSendForm, ProgrammeTestForm } from "./Forms";

/**
 * The programme letter to every buyer: how many still wait for it, the
 * wording as the reader sees it, and the buttons. Sent by hand, once per
 * address, in batches of a hundred.
 */
export async function ProgrammeMailSection() {
  const [audience, preview] = await Promise.all([programmeAudience(), programmePreview()]);

  return (
    <section id="programme-mail" className="mt-10 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
      <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold tracking-tight text-bh-ink">
        Писмо с програмата до всички с билет
        <span className="rounded-full bg-[#d0a11a]/20 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide text-[#7a5b00]">на ръка</span>
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bh-ink/60">
        Лекциите на сцената по дни и модули, петте workshops, experiences в залите и станциите, и кога и как се записват местата. Програмата на сцената се чете от админа в момента на пращане, така че последната промяна там влиза и в писмото. Непотвърдените лектори не се показват. Едно писмо на адрес, без значение колко поръчки има.
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
              <div className="mt-3"><ProgrammeTestForm /></div>
            </div>
          </div>
          <div className="mt-4"><ProgrammeSendForm count={audience.waiting} /></div>
          <p className="mt-3 text-xs text-bh-ink/55">Тема: {preview.subject}</p>
        </div>
        <div className="overflow-hidden rounded-2xl ring-1 ring-bh-ink/8">
          <iframe title="Писмото с програмата" srcDoc={preview.html} className="h-[40rem] w-full bg-[#f1f5f3]" sandbox="" />
        </div>
      </div>
    </section>
  );
}
