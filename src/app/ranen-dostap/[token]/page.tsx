import type { Metadata } from "next";

import { BackLink } from "@/components/BackLink";

import { confirm } from "./actions";

export const metadata: Metadata = {
  title: "Ранен достъп 2027 | Sofia Life Summit",
  robots: { index: false, follow: false },
};

/**
 * Confirming an early-access address someone else added. A button, not the
 * link itself: mail scanners open links on their own, and a click by a
 * scanner must not count as the person's yes.
 */
export default async function EarlyAccessPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ ok?: string }> }) {
  const { token } = await params;
  const { ok } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center rounded-[1.75rem] bg-bh-paper px-5 py-16">
      <div className="w-full max-w-md">
        <BackLink label="Към сайта" />
        <h1 className="mt-8 font-display text-[clamp(1.8rem,4.5vw,2.6rem)] font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">Ранен достъп 2027</h1>
        {ok === "1" ? (
          <p className="mt-4 text-sm leading-relaxed text-bh-ink/70">Готово! Ще ти пишем, когато билетите за Sofia Life Summit 2027 излязат, преди общата продажба. 💚</p>
        ) : ok === "0" ? (
          <p className="mt-4 text-sm leading-relaxed text-bh-ink/70">Линкът не е валиден или вече е използван. Ако искаш ранен достъп, пиши ни на hi@biohacking.bg.</p>
        ) : (
          <form action={confirm.bind(null, token)}>
            <p className="mt-4 text-sm leading-relaxed text-bh-ink/70">
              Потвърди, че искаш да ти пишем, когато билетите за Sofia Life Summit 2027 излязат, преди общата продажба. Можеш да се отпишеш по всяко време.
            </p>
            <button type="submit" className="mt-6 w-full rounded-full bg-bh-ink px-5 py-3.5 text-sm font-semibold text-bh-paper">Потвърждавам</button>
          </form>
        )}
      </div>
    </div>
  );
}
