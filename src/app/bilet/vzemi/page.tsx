import type { Metadata } from "next";
import Link from "next/link";

import { BackLink } from "@/components/BackLink";
import { langOf } from "@/lib/i18n";

import { ClaimForm } from "./Form";

export const metadata: Metadata = {
  title: "Добави билета си | Sofia Life Summit 2026",
  robots: { index: false, follow: false },
};

const T = {
  bg: {
    back: "Към сайта",
    title: "Добави билета си",
    intro: "Въведи номера на билета, името си и имейла си. Пращаме ти код, за да потвърдиш имейла, и билетът става твой: виждаш го в приложението с QR кода за входа, а с PLUS и PEAK си записваш workshops и experiences. Регистрирай го до 6 ноември, 00:00.",
    help: "Номерът е на билета, във вида ABCD-EFGH. Ако не го намираш, помоли човека, който е купил билета.",
  },
  en: {
    back: "Back to the site",
    title: "Add your ticket",
    intro: "Enter the ticket number, your name and your email. We send you a code to confirm the address, and the ticket is yours: you see it in the app with its QR code for the entrance, and with PLUS or PEAK you book workshops and experiences. Register it by 00:00 on 6 November.",
    help: "The number is on the ticket, in the form ABCD-EFGH. If you cannot find it, ask the person who bought the ticket.",
  },
} as const;

/** Where a person given a ticket takes it under their own name and address. */
export default async function ClaimPage({ searchParams }: { searchParams: Promise<{ lang?: string; kod?: string }> }) {
  const { lang: raw, kod } = await searchParams;
  const lang = langOf(raw);
  const t = T[lang];
  const code = kod && /^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(kod) ? kod.toUpperCase() : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center rounded-[1.75rem] bg-bh-paper px-5 py-16">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between gap-4">
          <BackLink>{t.back}</BackLink>
          <Link href={`/bilet/vzemi?lang=${lang === "en" ? "bg" : "en"}${code ? `&kod=${code}` : ""}`} className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink">
            {lang === "en" ? "Български" : "English"}
          </Link>
        </div>
        <h1 className="mt-8 text-[clamp(1.8rem,4vw,2.6rem)] font-display font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">{t.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-bh-ink/70">{t.intro}</p>
        <ClaimForm lang={lang} initialCode={code} />
        <p className="mt-6 text-xs leading-relaxed text-bh-ink/50">{t.help}</p>
      </div>
    </div>
  );
}
