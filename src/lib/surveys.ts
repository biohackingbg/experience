import "server-only";

import { randomBytes } from "node:crypto";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { earlyAccess, orders, surveyInvites, tickets } from "@/lib/db/schema";
import { SOLD } from "@/lib/sold";
import { EARLY_CONSENT, EARLY_YES, MAX_EXTRA_EMAILS, type Question, SURVEY_CLOSES_LABEL, type SurveyKind, questionsFor, surveyOpen } from "@/lib/survey-questions";
import { TIERS } from "@/lib/tickets";

export const SITE = "https://thelongevitysummit.eu";
const newToken = () => randomBytes(18).toString("base64url");
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type Invite = typeof surveyInvites.$inferSelect;
export const surveyUrl = (token: string) => `${SITE}/anketa/${token}`;

/** "MIHAIL VALERIEV LALEV" → "Mihail"; "мария иванова" → "Мария". */
export function firstName(full: string | null | undefined): string {
  const w = (full ?? "").trim().split(/\s+/)[0] ?? "";
  if (!w || /[@\d]/.test(w)) return "";
  return w.charAt(0).toLocaleUpperCase("bg") + w.slice(1).toLocaleLowerCase("bg");
}

const tierName = (id: string) => TIERS.find((t) => t.id === id)?.name ?? id.toUpperCase();

/**
 * Who gets which link. A ticket given to someone by address goes to that
 * person. The rest stay with the buyer: one of them is the buyer's own (the
 * one in their name, else the first), the others are listed in the buyer's
 * letter to pass on - each with its own link, so a group's answers stay apart.
 */
export type VisitorLetter = {
  to: string;
  name: string;
  own: { ticketId: string; label: string };
  others: { ticketId: string; label: string }[];
};

export async function visitorLetters(): Promise<VisitorLetter[]> {
  const rows = await getDb()
    .select({
      ticketId: tickets.id,
      tierId: tickets.tierId,
      attendeeName: tickets.attendeeName,
      attendeeEmail: tickets.attendeeEmail,
      buyer: orders.email,
      buyerName: orders.name,
      orderId: orders.id,
      createdAt: tickets.createdAt,
    })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(SOLD)
    .orderBy(tickets.createdAt);

  const byTo = new Map<string, VisitorLetter>();
  const norm = (s: string | null) => (s ?? "").trim().toLowerCase();
  const sameName = (a: string | null, b: string | null) => !!a && !!b && norm(a) === norm(b);

  // Tickets with their own address first: each is that person's own.
  for (const r of rows) {
    const holder = norm(r.attendeeEmail);
    if (!holder || !EMAIL.test(holder)) continue;
    const l = byTo.get(holder);
    const label = r.attendeeName?.trim() || tierName(r.tierId);
    if (!l) byTo.set(holder, { to: holder, name: firstName(r.attendeeName) || firstName(r.buyerName), own: { ticketId: r.ticketId, label }, others: [] });
    else l.others.push({ ticketId: r.ticketId, label: `${label} (${tierName(r.tierId)})` });
  }

  // The buyer's tickets that nobody took under their own address.
  const rest = new Map<string, typeof rows>();
  for (const r of rows) {
    if (norm(r.attendeeEmail) && EMAIL.test(norm(r.attendeeEmail))) continue;
    const buyer = norm(r.buyer);
    if (!EMAIL.test(buyer)) continue;
    rest.set(buyer, [...(rest.get(buyer) ?? []), r]);
  }
  for (const [buyer, list] of rest) {
    const existing = byTo.get(buyer);
    const mine = existing ? undefined : (list.find((r) => !r.attendeeName || sameName(r.attendeeName, r.buyerName)) ?? list[0]);
    let n = 1;
    const others = list
      .filter((r) => r !== mine)
      .map((r) => ({ ticketId: r.ticketId, label: r.attendeeName?.trim() ? `${r.attendeeName.trim()} (${tierName(r.tierId)})` : `Билет ${++n} (${tierName(r.tierId)})` }));
    if (existing) existing.others.push(...others);
    else if (mine) byTo.set(buyer, { to: buyer, name: firstName(mine.attendeeName) || firstName(mine.buyerName), own: { ticketId: mine.ticketId, label: mine.attendeeName?.trim() || mine.buyerName }, others });
  }
  return [...byTo.values()];
}

/** The invitation rows for these letters, made once: a second run finds them and keeps their tokens. */
export async function ensureVisitorInvites(letters: VisitorLetter[]): Promise<Map<string, Invite>> {
  const db = getDb();
  const ids = letters.flatMap((l) => [l.own.ticketId, ...l.others.map((o) => o.ticketId)]);
  const values = letters.flatMap((l) => [
    { kind: "visitor", token: newToken(), ticketId: l.own.ticketId, label: l.own.label, sentTo: l.to, holderEmail: l.to },
    ...l.others.map((o) => ({ kind: "visitor", token: newToken(), ticketId: o.ticketId, label: o.label, sentTo: l.to, holderEmail: null })),
  ]);
  for (let i = 0; i < values.length; i += 500) {
    await db.insert(surveyInvites).values(values.slice(i, i + 500)).onConflictDoNothing();
  }
  const rows: Invite[] = [];
  for (let i = 0; i < ids.length; i += 1000) {
    rows.push(...(await db.select().from(surveyInvites).where(and(eq(surveyInvites.kind, "visitor"), inArray(surveyInvites.ticketId, ids.slice(i, i + 1000))))));
  }
  return new Map(rows.map((r) => [r.ticketId!, r]));
}

export async function markSent(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;
  await getDb().update(surveyInvites).set({ sentAt: new Date() }).where(inArray(surveyInvites.token, tokens));
}

export async function createPartnerInvite(brand: string, name: string, email: string, test = false): Promise<Invite> {
  const [row] = await getDb()
    .insert(surveyInvites)
    .values({ kind: test ? "partner-test" : "partner", token: newToken(), brand, label: name || null, sentTo: email, holderEmail: email })
    .returning();
  return row;
}

/** A visitor link for a test letter: it works like the real one, and its answer stays out of the results. */
export async function createTestVisitorInvite(label: string, email: string | null): Promise<Invite> {
  const [row] = await getDb()
    .insert(surveyInvites)
    .values({ kind: "visitor-test", token: newToken(), label, sentTo: email, holderEmail: email })
    .returning();
  return row;
}

export async function getInvite(token: string): Promise<Invite | null> {
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(token)) return null;
  const [row] = await getDb().select().from(surveyInvites).where(eq(surveyInvites.token, token)).limit(1);
  return row ?? null;
}

/** For the visitor form: the day the ticket was scanned at the door, as the answer to pre-select. */
export async function scannedDay(ticketId: string | null): Promise<string | null> {
  if (!ticketId) return null;
  const [t] = await getDb().select({ day: tickets.day, at: tickets.checkedInAt }).from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  if (!t) return null;
  if (t.at) {
    const d = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(t.at);
    if (d === "2026-11-07") return t.day === 1 ? "7 ноември (събота)" : t.day === 2 ? "8 ноември (неделя)" : null;
    if (d === "2026-11-08") return "8 ноември (неделя)";
  }
  return t.day === 1 ? "7 ноември (събота)" : t.day === 2 ? "8 ноември (неделя)" : null;
}

export type Answers = Record<string, string | number | string[]>;
export type SubmitResult = { ok: true; confirmSent: string[] } | { ok: false; error: string };

/** Reads the form against the questions: only known ids, only offered options, lengths capped. */
export function readAnswers(questions: Question[], form: FormData): { answers: Answers; early: string[] } | { error: string } {
  const answers: Answers = {};
  let early: string[] = [];
  const text = (k: string, max = 2000) => String(form.get(k) ?? "").trim().slice(0, max);
  for (const q of questions) {
    if (q.kind === "scale") {
      const raw = text(q.id, 3);
      const v = raw === "" ? NaN : Number(raw);
      if (Number.isInteger(v) && v >= q.min && v <= q.max) answers[q.id] = v;
      else if (q.required) return { error: `Отговори на „${q.label}“` };
    } else if (q.kind === "single") {
      const v = text(q.id, 200);
      const other = text(`${q.id}__other`, 200);
      if (q.options.includes(v)) answers[q.id] = v;
      else if (q.other && v === "__other" && other) answers[q.id] = `Друго: ${other}`;
      else if (q.required) return { error: `Отговори на „${q.label}“` };
    } else if (q.kind === "multi") {
      const picked = form.getAll(q.id).map(String).filter((v) => q.options.includes(v));
      const other = text(`${q.id}__other`, 200);
      if (q.other && other) picked.push(`Друго: ${other}`);
      if (picked.length) answers[q.id] = picked;
      else if (q.required) return { error: `Отговори на „${q.label}“` };
    } else if (q.kind === "text") {
      const v = text(q.id, q.long ? 2000 : 300);
      if (v) answers[q.id] = v;
      else if (q.required) return { error: `Попълни „${q.label}“` };
    } else if (q.kind === "early") {
      const v = text(q.id, 40);
      if (v) answers[q.id] = v;
      if (v === EARLY_YES) {
        early = form
          .getAll("earlyEmail")
          .map((e) => String(e).trim().toLowerCase())
          .filter(Boolean)
          .slice(0, MAX_EXTRA_EMAILS + 1);
        const bad = early.find((e) => !EMAIL.test(e) || e.length > 254);
        if (bad) return { error: `Имейлът „${bad}“ не изглежда верен.` };
        early = [...new Set(early)];
        if (early.length === 0) return { error: "Напиши имейл за ранния достъп." };
        answers.earlyEmails = early;
      }
    }
  }
  return { answers, early };
}

/**
 * Saves the answers once. The early-access addresses: the link owner's own
 * address is in at once (they ticked it themselves); any other address gets
 * a letter and is in only when its owner confirms.
 */
export async function submitSurvey(invite: Invite, form: FormData, kind: SurveyKind): Promise<SubmitResult & { toConfirm?: { email: string; token: string }[] }> {
  if (invite.submittedAt) return { ok: false, error: "Тази анкета вече е попълнена. Благодарим!" };
  if (!surveyOpen()) return { ok: false, error: `Анкетата приключи на ${SURVEY_CLOSES_LABEL}. Благодарим!` };
  const read = readAnswers(questionsFor(kind), form);
  if ("error" in read) return { ok: false, error: read.error };

  const db = getDb();
  const done = await db
    .update(surveyInvites)
    .set({ answers: read.answers, submittedAt: new Date() })
    .where(and(eq(surveyInvites.id, invite.id), isNull(surveyInvites.submittedAt)))
    .returning({ id: surveyInvites.id });
  if (done.length === 0) return { ok: false, error: "Тази анкета вече е попълнена. Благодарим!" };

  const toConfirm: { email: string; token: string }[] = [];
  const holder = (invite.holderEmail ?? "").toLowerCase();
  for (const email of read.early) {
    const self = email === holder;
    const token = self ? null : newToken();
    const [row] = await db
      .insert(earlyAccess)
      .values({ email, invitedBy: self ? null : holder || invite.sentTo, consentText: EARLY_CONSENT, confirmToken: token, confirmedAt: self ? new Date() : null })
      .onConflictDoNothing()
      .returning({ id: earlyAccess.id });
    if (row && token) toConfirm.push({ email, token });
    // Already on the list: a self tick confirms an address someone else added.
    if (!row && self) await db.update(earlyAccess).set({ confirmedAt: sql`coalesce(${earlyAccess.confirmedAt}, now())` }).where(eq(earlyAccess.email, email));
  }
  return { ok: true, confirmSent: toConfirm.map((c) => c.email), toConfirm };
}

export async function confirmEarlyAccess(token: string): Promise<"ok" | "already" | "missing"> {
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(token)) return "missing";
  const db = getDb();
  const [row] = await db.select().from(earlyAccess).where(eq(earlyAccess.confirmToken, token)).limit(1);
  if (!row) return "missing";
  if (row.confirmedAt) return "already";
  await db.update(earlyAccess).set({ confirmedAt: new Date() }).where(eq(earlyAccess.id, row.id));
  return "ok";
}

export async function markEarlyInvited(emails: string[]): Promise<void> {
  if (emails.length) await getDb().update(earlyAccess).set({ inviteSentAt: new Date() }).where(inArray(earlyAccess.email, emails));
}

/** Everything answered, for the admin and the CSV. */
export async function surveyResults(kind: SurveyKind) {
  const db = getDb();
  const rows = await db
    .select({
      id: surveyInvites.id,
      label: surveyInvites.label,
      brand: surveyInvites.brand,
      sentTo: surveyInvites.sentTo,
      sentAt: surveyInvites.sentAt,
      answers: surveyInvites.answers,
      submittedAt: surveyInvites.submittedAt,
      tierId: tickets.tierId,
    })
    .from(surveyInvites)
    .leftJoin(tickets, sql`${tickets.id} = ${surveyInvites.ticketId}`)
    .where(eq(surveyInvites.kind, kind));
  return rows;
}

export async function earlyAccessList() {
  return getDb().select().from(earlyAccess).orderBy(earlyAccess.createdAt);
}

/**
 * The daily note while the survey runs: what came in today, where the
 * totals stand, and today's written answers to read. Nothing when nothing
 * came in - a note saying "0" every evening is noise.
 */
export async function surveyDigest(now = new Date()): Promise<{ subject: string; text: string; html: string } | null> {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" });
  const today = day.format(now);
  const [visitors, partners, early] = await Promise.all([surveyResults("visitor"), surveyResults("partner"), earlyAccessList()]);
  const isToday = (d: Date | null) => !!d && day.format(d) === today;

  const block = (name: string, kind: SurveyKind, rows: Awaited<ReturnType<typeof surveyResults>>) => {
    const sent = rows.filter((r) => r.sentAt).length;
    const done = rows.filter((r) => r.submittedAt);
    const fresh = done.filter((r) => isToday(r.submittedAt));
    const num = (id: string, list = done) => list.map((r) => Number((r.answers as Record<string, unknown> | null)?.[id])).filter((n) => Number.isFinite(n));
    const nps = num("nps");
    const score = nps.length ? Math.round(((nps.filter((n) => n >= 9).length - nps.filter((n) => n <= 6).length) / nps.length) * 100) : null;
    const avg = (id: string) => {
      const v = num(id);
      return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "-";
    };
    const lines = [
      `${name}: +${fresh.length} днес, общо ${done.length} от ${sent} пратени${sent ? ` (${Math.round((done.length / sent) * 100)}%)` : ""}`,
      `NPS ${score === null ? "-" : score > 0 ? `+${score}` : score}`,
      kind === "visitor" ? `Лекции ${avg("talks")} от 5, организация ${avg("organisation")} от 5` : `Екип ${avg("team")} от 5, трафик ${avg("traffic")} от 5, публика ${avg("audience")} от 5`,
    ];
    const texts = questionsFor(kind)
      .filter((q) => q.kind === "text" && q.long)
      .flatMap((q) => fresh.map((r) => (r.answers as Record<string, unknown> | null)?.[q.id]).filter(Boolean).map((v) => `${q.label}\n  „${String(v)}“`));
    return { fresh: fresh.length, lines, texts };
  };

  const v = block("Посетители", "visitor", visitors);
  const p = block("Партньори", "partner", partners);
  if (v.fresh + p.fresh === 0) return null;
  const confirmed = early.filter((e) => e.confirmedAt).length;
  const earlyLine = `Ранен достъп 2027: ${confirmed} потвърдени, ${early.length - confirmed} чакат потвърждение`;

  const textParts = [
    ...v.lines,
    "",
    ...(p.fresh || partners.some((r) => r.sentAt) ? [...p.lines, ""] : []),
    earlyLine,
    ...(v.texts.length || p.texts.length ? ["", "Написано днес:", ...v.texts, ...p.texts] : []),
    "",
    `Всички отговори: ${SITE}/admin/anketa`,
  ];
  const esc = (s: string) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const html = `<div style="font:14px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#02251f;white-space:pre-wrap">${esc(textParts.join("\n"))}</div>`;
  const vScore = v.lines[1].replace("NPS ", "");
  return { subject: `Анкета: +${v.fresh + p.fresh} днес, NPS ${vScore}`, text: textParts.join("\n"), html };
}
