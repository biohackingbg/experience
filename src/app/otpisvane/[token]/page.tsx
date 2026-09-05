import type { Metadata } from "next";
import Link from "next/link";

import { unsubscribe } from "@/lib/newsletter";
import { readUnsubscribeToken } from "@/lib/unsubscribe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Отписване | Sofia Life Summit",
  robots: { index: false, follow: false },
};

/**
 * One click, no login, no form: the link in the letter is signed, so opening
 * it is proof enough. Gmail's own unsubscribe button posts to the same URL.
 */
export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const email = readUnsubscribeToken(decodeURIComponent(token));
  const done = email ? await unsubscribe(email) : false;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bh-paper px-5 py-16">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center ring-1 ring-bh-ink/8">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Sofia Life Summit</p>
        {done ? (
          <>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-bh-ink">Отписахме те</h1>
            <p className="mt-3 text-sm leading-relaxed text-bh-ink/65">
              Няма да получаваш повече писма с новини. Ако имаш купен билет, писмата за него - билетът,
              фактурата и практичното преди събитието - продължават, защото са част от покупката.
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-bh-ink">Връзката не е валидна</h1>
            <p className="mt-3 text-sm leading-relaxed text-bh-ink/65">
              Отвори връзката от самото писмо или ни пиши на{" "}
              <a href="mailto:hi@biohacking.bg" className="underline">hi@biohacking.bg</a> и ще те махнем на ръка.
            </p>
          </>
        )}
        <Link href="/" className="mt-6 inline-flex rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper">
          Към сайта
        </Link>
      </div>
    </div>
  );
}
