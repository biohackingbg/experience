import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { HomeLink } from "@/components/admin/HomeLink";
import { isAdmin } from "@/lib/admin-auth";
import { eventInfoSubject, eventInfoText } from "@/lib/email";
import { getInfoMailAudience, sampleInput } from "@/lib/event-mail";

import { SendAllForm, TestForm } from "./Forms";

export const metadata: Metadata = {
  title: "Писма | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The mail before the event, to every buyer, once. Read it as a test
 * first; the big button only ever sends to those who have not had it.
 */
export default async function MailPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const [audience, sample] = [await getInfoMailAudience(), sampleInput()];

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">Писма</h1>
          </div>
          <HomeLink />
        </div>

        <section className="mt-8 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Преди събитието</h2>
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
              <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">Първо го прочети</div>
              <div className="mt-3"><TestForm /></div>
            </div>
          </div>

          <div className="mt-6"><SendAllForm pending={audience.pending} /></div>
        </section>

        <section className="mt-6 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
          <h2 className="text-sm font-bold tracking-tight text-bh-ink">Какво пише</h2>
          <p className="mt-1 text-xs text-bh-ink/55">Тема: {eventInfoSubject(sample.daysLeft)}</p>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl bg-bh-paper p-5 font-sans text-sm leading-relaxed text-bh-ink ring-1 ring-bh-ink/8">
            {eventInfoText(sample)}
          </pre>
          <p className="mt-3 text-xs text-bh-ink/50">
            Истинското писмо е с оформление и бутони; тук е само текстът. Ако нещо трябва да се промени, кажи.
          </p>
        </section>
      </div>
    </div>
  );
}
