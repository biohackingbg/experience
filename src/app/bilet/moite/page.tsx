import type { Metadata } from "next";
import Link from "next/link";

import { RESEND_PAGE, langOf } from "@/lib/i18n";

import { MyTicketsForm } from "./Form";

export const metadata: Metadata = {
  title: "Изгубих билета си | Sofia Life Summit 2026",
  robots: { index: false, follow: false },
};

/** The answer to the commonest email: the buyer sends the tickets to themselves. */
export default async function MyTicketsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang: raw } = await searchParams;
  const lang = langOf(raw);
  const t = RESEND_PAGE[lang];

  return (
    <div className="flex min-h-screen items-center justify-center rounded-[1.75rem] bg-bh-paper px-5 py-16">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/50 transition-colors hover:text-bh-ink">{t.back}</Link>
          <Link href={`/bilet/moite?lang=${lang === "en" ? "bg" : "en"}`} className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink">
            {lang === "en" ? "Български" : "English"}
          </Link>
        </div>
        <h1 className="mt-8 text-[clamp(1.8rem,4vw,2.6rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">{t.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-bh-ink/70">{t.intro}</p>
        <MyTicketsForm lang={lang} />
        <p className="mt-6 text-xs leading-relaxed text-bh-ink/50">{t.help}</p>
      </div>
    </div>
  );
}
