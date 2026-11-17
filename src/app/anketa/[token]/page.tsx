import type { Metadata } from "next";

import { BackLink } from "@/components/BackLink";
import { SURVEY_CLOSES_LABEL, questionsFor, surveyOpen } from "@/lib/survey-questions";
import { firstName, getInvite, scannedDay } from "@/lib/surveys";

import { SurveyForm } from "./Form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Анкета | Sofia Life Summit 2026",
  robots: { index: false, follow: false },
};

/**
 * The survey after the summit, one personal link per ticket (or partner).
 * The link is the only key: it says whose answer this is, so the form asks
 * nothing we already know, and it takes one answer.
 */
export default async function SurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await getInvite(token);
  const partner = !!invite?.kind.startsWith("partner");

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen rounded-[1.75rem] bg-bh-paper px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <BackLink label="Към сайта" />
        {children}
      </div>
    </div>
  );

  if (!invite) {
    return shell(
      <>
        <h1 className="mt-8 font-display text-[clamp(1.8rem,4.5vw,2.8rem)] font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">Линкът не е валиден</h1>
        <p className="mt-4 text-sm leading-relaxed text-bh-ink/70">Провери дали е копиран целият линк от писмото. Ако проблемът остане, пиши ни на hi@biohacking.bg.</p>
      </>,
    );
  }

  if (invite.submittedAt) {
    return shell(
      <>
        <h1 className="mt-8 font-display text-[clamp(1.8rem,4.5vw,2.8rem)] font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">Благодарим!</h1>
        <p className="mt-4 text-sm leading-relaxed text-bh-ink/70">
          {partner ? "Анкетата за Вашата марка вече е попълнена." : "Тази анкета вече е попълнена. Ако си бил/а с компания, всеки има свой линк в писмото."}
        </p>
      </>,
    );
  }

  if (!surveyOpen()) {
    return shell(
      <>
        <h1 className="mt-8 font-display text-[clamp(1.8rem,4.5vw,2.8rem)] font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">Анкетата приключи</h1>
        <p className="mt-4 text-sm leading-relaxed text-bh-ink/70">Анкетата беше отворена до {SURVEY_CLOSES_LABEL}. Благодарим на всички, които отговориха! Ако искаш да ни кажеш нещо, пиши на hi@biohacking.bg.</p>
      </>,
    );
  }

  const day = partner ? null : await scannedDay(invite.ticketId);
  const presets: Record<string, string | null> = partner ? { brand: invite.brand, person: invite.label, email: invite.holderEmail } : { day };
  const name = !partner && invite.label && !/^Билет \d/.test(invite.label) ? firstName(invite.label.replace(/\s*\([^)]*\)\s*$/, "")) || null : null;

  return shell(
    <>
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Sofia Life Summit 2026</p>
      <h1 className="mt-2 font-display text-[clamp(1.8rem,4.5vw,2.8rem)] font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">
        {partner ? "Анкета за партньорите" : name ? `${name}, как беше?` : "Как беше?"}
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-bh-ink/70">
        {partner
          ? `Отнема около 3 минути и е отворена до ${SURVEY_CLOSES_LABEL}. Отговорите Ви ще определят формата за 2027.${invite.brand ? ` Анкетата е за ${invite.brand}.` : ""}`
          : `Отнема около 2 минути и е отворена до ${SURVEY_CLOSES_LABEL}. Ще прочетем всеки отговор. Задължителни са само въпросите със звездичка.`}
      </p>
      <SurveyForm token={token} questions={questionsFor(partner ? "partner" : "visitor")} presets={presets} holderEmail={invite.holderEmail} partner={partner} />
    </>,
  );
}
