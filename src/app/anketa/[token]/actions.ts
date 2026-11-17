"use server";

import { headers } from "next/headers";

import { checkRateLimit } from "@/lib/rate-limit";
import { earlyConfirmMail, sendMails } from "@/lib/survey-emails";
import { getInvite, markEarlyInvited, submitSurvey } from "@/lib/surveys";

export type SurveyState = { status: "idle" | "error" | "done"; error?: string; confirmSent?: string[] };

export async function submitAnswers(token: string, _prev: SurveyState, formData: FormData): Promise<SurveyState> {
  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`anketa:${ip}`, 30).allowed) return { status: "error", error: "Твърде много опити. Опитай след малко." };

  const invite = await getInvite(token);
  if (!invite) return { status: "error", error: "Линкът не е валиден." };
  const kind = invite.kind.startsWith("partner") ? "partner" : "visitor";
  const r = await submitSurvey(invite, formData, kind);
  if (!r.ok) return { status: "error", error: r.error };

  // The addresses added for someone else: each gets a letter to confirm.
  if (r.toConfirm?.length) {
    const named = invite.label?.replace(/\s*\([^)]*\)\s*$/, "").trim();
    const by = named && !/^Билет \d/.test(named) ? named : "Посетител на Sofia Life Summit";
    const sent = await sendMails(r.toConfirm.map((c) => earlyConfirmMail({ to: c.email, by, token: c.token })));
    if (sent.sent) await markEarlyInvited(r.toConfirm.slice(0, sent.sent).map((c) => c.email));
  }
  return { status: "done", confirmSent: r.confirmSent };
}
