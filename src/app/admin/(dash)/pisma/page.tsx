import type { Metadata } from "next";

import { HomeLink } from "@/components/admin/HomeLink";
import { requireAccess } from "@/lib/access";
import { getInfoMailAudience } from "@/lib/event-mail";
import { MAIL_GROUPS, MAIL_KINDS, mailPreview } from "@/lib/mail-samples";
import { MAIL_SLOTS, defaultMailTexts, getMailTexts } from "@/lib/mail-texts";

import { SendAllForm, TestForm } from "./Forms";
import { TextForm } from "./TextForm";

export const metadata: Metadata = {
  title: "Писма | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Every mail a buyer can receive, shown as the buyer sees it, and the one
 * that is sent by hand - the mail before the event - with its controls.
 */
export default async function MailPage() {
  await requireAccess("pisma");
  const audience = await getInfoMailAudience();
  const previews = await Promise.all(MAIL_KINDS.map(mailPreview));
  const texts = await getMailTexts();

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">Писма</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bh-ink/60">
              Всяко писмо, което сайтът праща - до купувачи, до спонсори и фирми, и до
              нас - показано както го вижда получателят. Данните в примерите са
              измислени; само дневната справка е днешната истинска. Под всяко писмо
              можеш да смениш думите му: оформлението, бутоните и таблиците остават
              непокътнати.
            </p>
          </div>
          <HomeLink />
        </div>

        <section className="mt-8 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Прати писмото преди събитието</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bh-ink/60">
            Адрес, час на отваряне, програмата и билетите още веднъж, плюс
            молбата всеки билет да носи името на човека, който ще го ползва.
            Праща се на купувача на всяка платена поръчка, само веднъж. Най-добре
            около седмица преди 7 ноември - броят дни в темата се смята сам.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-bh-paper p-5 ring-1 ring-bh-ink/8">
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">Чакат писмото</div>
              <div className="mt-2 text-3xl font-black tracking-tight text-bh-ink">{audience.pending}</div>
              <div className="mt-1 text-xs text-bh-ink/55">{audience.sent} вече са го получили</div>
            </div>
            <div className="rounded-2xl bg-bh-paper p-5 ring-1 ring-bh-ink/8">
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">Първо го прочети в пощата си</div>
              <div className="mt-3"><TestForm /></div>
            </div>
          </div>
          <div className="mt-6"><SendAllForm pending={audience.pending} /></div>
        </section>

        {MAIL_GROUPS.map((g) => (
          <section key={g.id} className="mt-10">
            <h2 className="text-lg font-bold tracking-tight text-bh-ink">{g.label}</h2>
            <div className="mt-4 flex flex-col gap-6">
              {previews
                .filter((m) => m.group === g.id)
                .map((m) => (
                  <section key={m.kind} id={m.kind} className="rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="flex flex-wrap items-center gap-2 text-base font-bold tracking-tight text-bh-ink">
                        {m.title}
                        {/* Which letters nobody has to remember to send, and
                            which wait for a button, is the first thing the
                            team asks of this page. */}
                        <span
                          className={`rounded-full px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wide ${
                            m.manual ? "bg-[#d0a11a]/20 text-[#7a5b00]" : "bg-[#0E8C7D]/15 text-[#0b6d61]"
                          }`}
                        >
                          {m.manual ? "на ръка" : "автоматично"}
                        </span>
                      </h3>
                      <a href={`/admin/pisma/preglad/${m.kind}`} target="_blank" rel="noreferrer" className="text-xs text-bh-ink/55 underline underline-offset-2 hover:text-bh-ink">
                        отвори в нов таб
                      </a>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-bh-ink/55">{m.when}</p>
                    <p className="mt-3 text-sm text-bh-ink">
                      <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">Тема · </span>
                      {m.subject}
                    </p>
                    {m.html === null ? (
                      /* A letter that was never HTML: shown as the plain text
                         it is, rather than dressed up in a frame. */
                      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-bh-paper p-5 font-sans text-sm leading-relaxed text-bh-ink ring-1 ring-bh-ink/8">
                        {m.text}
                      </pre>
                    ) : (
                      <>
                        {/* The real rendering, in its own document - email HTML must not
                            inherit the dashboard's styles, or it would lie about itself.
                            Inlined (srcDoc) rather than loaded by URL: the whole site
                            refuses to be framed (frame-ancestors 'none'), and a frame
                            with inline content makes no request for that rule to stop. */}
                        <iframe
                          title={`Превю: ${m.title}`}
                          srcDoc={m.html}
                          sandbox=""
                          className="mt-4 h-[46rem] w-full rounded-2xl bg-[#f2f2ee] ring-1 ring-bh-ink/8"
                        />
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs font-semibold text-bh-ink/70">Само текстът (както го виждат без картинки)</summary>
                          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-bh-paper p-5 font-sans text-sm leading-relaxed text-bh-ink ring-1 ring-bh-ink/8">
                            {m.text}
                          </pre>
                        </details>
                      </>
                    )}
                    {/* The words of this letter, under the letter itself -
                        editing a sentence without seeing where it lands is
                        how a heading ends up a paragraph long. */}
                    {MAIL_SLOTS.some((slot) => slot.letter === m.kind) && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-xs font-semibold text-bh-ink/70">Промени текстовете</summary>
                        <TextForm
                          letter={m.kind}
                          slots={MAIL_SLOTS.filter((slot) => slot.letter === m.kind).map((slot) => ({
                            id: slot.id,
                            label: slot.label,
                            hint: slot.hint,
                            vars: [...slot.vars],
                            multiline: slot.multiline,
                            value: texts[slot.id],
                            isDefault: texts[slot.id] === defaultMailTexts[slot.id],
                          }))}
                        />
                      </details>
                    )}
                  </section>
                ))}
            </div>
          </section>
        ))}
        <p className="mt-4 text-xs text-bh-ink/50">Ако нещо в текстовете трябва да се промени, кажи и ще го сменя.</p>
      </div>
    </div>
  );
}
