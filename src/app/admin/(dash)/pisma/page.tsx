import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { HomeLink } from "@/components/admin/HomeLink";
import { isAdmin } from "@/lib/admin-auth";
import { getInfoMailAudience } from "@/lib/event-mail";
import { MAIL_KINDS, mailPreview } from "@/lib/mail-samples";

import { SendAllForm, TestForm } from "./Forms";

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
  if (!(await isAdmin())) redirect("/admin/login");
  const audience = await getInfoMailAudience();
  const previews = MAIL_KINDS.map(mailPreview);

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">Писма</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bh-ink/60">
              Всичко, което купувачите получават от нас, показано както го виждат
              те. Данните в примерите са измислени.
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

        <h2 className="mt-10 text-lg font-bold tracking-tight text-bh-ink">Какво получават купувачите</h2>
        <div className="mt-4 flex flex-col gap-6">
          {previews.map((m) => (
            <section key={m.kind} id={m.kind} className="rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-base font-bold tracking-tight text-bh-ink">{m.title}</h3>
                <a href={`/admin/pisma/preglad/${m.kind}`} target="_blank" rel="noreferrer" className="text-xs text-bh-ink/55 underline underline-offset-2 hover:text-bh-ink">
                  отвори в нов таб
                </a>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-bh-ink/55">{m.when}</p>
              <p className="mt-3 text-sm text-bh-ink">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">Тема · </span>
                {m.subject}
              </p>
              {/* The real rendering, in its own document - email HTML must not
                  inherit the dashboard's styles, or it would lie about itself. */}
              <iframe
                title={`Превю: ${m.title}`}
                src={`/admin/pisma/preglad/${m.kind}`}
                sandbox=""
                className="mt-4 h-[46rem] w-full rounded-2xl bg-[#f2f2ee] ring-1 ring-bh-ink/8"
              />
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-bh-ink/70">Само текстът (както го виждат без картинки)</summary>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-bh-paper p-5 font-sans text-sm leading-relaxed text-bh-ink ring-1 ring-bh-ink/8">
                  {m.text}
                </pre>
              </details>
            </section>
          ))}
        </div>
        <p className="mt-4 text-xs text-bh-ink/50">Ако нещо в текстовете трябва да се промени, кажи и ще го сменя.</p>
      </div>
    </div>
  );
}
