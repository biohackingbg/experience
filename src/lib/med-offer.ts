import "server-only";

import { randomInt } from "node:crypto";

import { eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { emailSends, promoCodes } from "@/lib/db/schema";
import { sendSequenceMail } from "@/lib/email";
import { getPricing, priceOf } from "@/lib/pricing";
import { createPromo } from "@/lib/promo";
import { type Letter, plainLetter } from "@/lib/sequence-letters";
import { getSetting, setSetting } from "@/lib/settings";
import { TIERS, formatPrice, getTier } from "@/lib/tickets";
import { unsubscribePostUrl, unsubscribeUrl } from "@/lib/unsubscribe";

/**
 * The letter to people who bought a ticket for the medical conference and
 * cannot go - it is for doctors. The Bulgarian Longevity Association got
 * their 50 € and passes it on to us, so they owe us nothing: what they get
 * is a personal code worth 50 € off, to spend on a PLUS or a PEAK ticket,
 * or two CORE tickets that we issue by hand when they answer.
 *
 * Kept as a setting, not a table: a short list the team edits by hand, with
 * the wording beside it. Each person has their own one-use code, made when
 * they are added, so a code cannot travel and its use is visible in
 * Промо кодове. The send is claimed per address in email_sends under kind
 * "med-offer", so pressing the button again, or after adding one more
 * person, writes only to those who have not had it.
 */
export const MED_KIND = "med-offer";
export const MED_CREDIT_CENTS = 5000;

export type MedRecipient = { name: string; email: string; code?: string };
export type MedOffer = { recipients: MedRecipient[]; subject: string; body: string; /** YYYY-MM-DD, last day the codes work. */ until: string };

export const DEFAULT_SUBJECT = "Билетът ви за медицинската конференция и какво можем да направим с него";

export const DEFAULT_UNTIL = "2026-10-31";

/**
 * {{name}} is the first name; {{code}} the person's own code; {{until}} the last day it works;
 * {{plus}}, {{plus_extra}}, {{peak}}, {{peak_extra}} are today's prices and what is left to pay after the 50 €.
 */
export const DEFAULT_BODY = `Здравей, {{name}}!

Купили сте билет за медицинската конференция на Bulgarian Longevity Association за 50 €. Тя е само за лекари и затова не можете да присъствате. Не е нужно да правите нищо със сумата: тя е у нас от Асоциацията и е ваша като кредит за Sofia Life Summit - феста в същите дни, 7-8 ноември, който е за всички, без нужда от медицинско образование.

Ето какво можете да изберете:

**Вариант 1 · два билета CORE, без доплащане**
Един билет за събота и един за неделя на ваше име, така че сте и в двата дни. С CORE са включени лекциите при наличие на места и партньорските оферти. Отговорете на това писмо с „Вариант 1“ и ние ви издаваме двата билета.

**Вариант 2 · билет PLUS за {{plus}} € (с кредита доплащате {{plus_extra}} €)**
- И двата дни
- Приоритетен достъп до лекциите
- Работилниците са включени
- 1 специално преживяване по избор
- Goody bag на стойност над 100 €

**Вариант 3 · билет PEAK за {{peak}} € (с кредита доплащате {{peak_extra}} €)**
- Гарантиран достъп и премиум зона
- Premium Lounge и Meet & Greet с лектори
- Приоритетен вход, работилници и преживявания с приоритет
- Goody bag на стойност над 250 €

За вариант 2 и 3 вземате билета от thelongevitysummit.eu/bilet и в полето за промокод пишете личния си код:

**{{code}}**

Той сваля 50 € от цената и важи до {{until}}, за един билет. Ако имате въпрос, просто отговорете на това писмо.`;

const KEY = "med_offer" as const;

export async function getMedOffer(): Promise<MedOffer> {
  const row = await getSetting(KEY);
  const empty: MedOffer = { recipients: [], subject: DEFAULT_SUBJECT, body: DEFAULT_BODY, until: DEFAULT_UNTIL };
  if (!row) return empty;
  try {
    const v = JSON.parse(row.value) as Partial<MedOffer>;
    return {
      recipients: Array.isArray(v.recipients) ? v.recipients.filter((r) => r && typeof r.email === "string") : [],
      subject: v.subject?.trim() || DEFAULT_SUBJECT,
      body: v.body?.trim() || DEFAULT_BODY,
      until: v.until && /^\d{4}-\d{2}-\d{2}$/.test(v.until) ? v.until : DEFAULT_UNTIL,
    };
  } catch {
    return empty;
  }
}

export async function saveMedOffer(offer: MedOffer): Promise<void> {
  await setSetting(KEY, JSON.stringify(offer));
}

const EMAIL = /[^\s@;,]+@[^\s@;,]+\.[^\s@;,]+/;

/** "Име Фамилия; имейл" per line (a comma or a tab works too). Lines without an address are returned as unread. */
export function parseRecipients(text: string): { ok: MedRecipient[]; unread: string[] } {
  const ok: MedRecipient[] = [];
  const unread: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(EMAIL);
    if (!m) {
      unread.push(line);
      continue;
    }
    const name = line.replace(m[0], "").replace(/[;,\t|]+/g, " ").replace(/\s+/g, " ").trim();
    if (!name) {
      unread.push(line);
      continue;
    }
    ok.push({ name, email: m[0].toLowerCase() });
  }
  return { ok, unread };
}

/** The last moment of the day, Sofia time (UTC+2 in the autumn, +3 in summer: the evening of that date either way). */
const endOfDay = (ymd: string) => new Date(`${ymd}T20:59:59Z`);

/** Letters without 0/O/1/I, so a code read aloud or from a phone survives. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = () => `BLA-${Array.from({ length: 5 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("")}`;

/** Gives everyone on the list their own one-use code, creating it in Промо кодове; saves the list. */
export async function ensureCodes(offer: MedOffer): Promise<MedOffer> {
  let changed = false;
  const recipients: MedRecipient[] = [];
  for (const r of offer.recipients) {
    if (r.code) {
      recipients.push(r);
      continue;
    }
    for (let i = 0; i < 6; i++) {
      const code = makeCode();
      const made = await createPromo({
        code,
        kind: "fixed",
        value: MED_CREDIT_CENTS,
        maxUses: 1,
        validUntil: endOfDay(offer.until),
        note: `Медицинска конференция: ${r.name}`,
      });
      if (made === "ok") {
        recipients.push({ ...r, code });
        changed = true;
        break;
      }
    }
    if (!recipients.some((x) => x.email === r.email)) recipients.push(r);
  }
  const next = { ...offer, recipients };
  if (changed) await saveMedOffer(next);
  return next;
}

/** Switches a person's code off when they come off the list. */
export async function retireCode(code: string | undefined): Promise<void> {
  if (!code) return;
  await getDb().update(promoCodes).set({ active: false }).where(eq(promoCodes.code, code));
}

/** The last day moves: every code of the list follows it. */
export async function moveCodesUntil(offer: MedOffer, until: string): Promise<void> {
  const codes = offer.recipients.map((r) => r.code).filter((c): c is string => !!c);
  if (!codes.length) return;
  await getDb()
    .update(promoCodes)
    .set({ validUntil: endOfDay(until) })
    .where(sql`${promoCodes.code} in (${sql.join(codes.map((c) => sql`${c}`), sql`, `)})`);
}

const bgDay = (ymd: string) =>
  new Date(`${ymd}T12:00:00Z`).toLocaleDateString("bg-BG", { day: "numeric", month: "long", timeZone: "UTC" });

async function fill(body: string, r: MedRecipient, until: string): Promise<string> {
  const pricing = await getPricing();
  const plus = getTier("plus") ?? TIERS[1];
  const peak = getTier("peak") ?? TIERS[2];
  const p = priceOf(pricing, plus);
  const k = priceOf(pricing, peak);
  const first = r.name.trim().split(/\s+/)[0] || r.name;
  return body
    .replaceAll("{{name}}", first)
    .replaceAll("{{code}}", r.code ?? "BLA-XXXXX")
    .replaceAll("{{until}}", bgDay(until))
    .replaceAll("{{plus}}", formatPrice(p))
    .replaceAll("{{plus_extra}}", formatPrice(Math.max(0, p - MED_CREDIT_CENTS)))
    .replaceAll("{{peak}}", formatPrice(k))
    .replaceAll("{{peak_extra}}", formatPrice(Math.max(0, k - MED_CREDIT_CENTS)));
}

export async function renderMedLetter(offer: MedOffer, r: MedRecipient): Promise<Letter> {
  return plainLetter({
    subject: offer.subject,
    text: await fill(offer.body, r, offer.until),
    why: "Получавате това писмо, защото сте купили билет за медицинската конференция.",
    unsubUrl: unsubscribeUrl(r.email),
  });
}

export async function sentTo(): Promise<Set<string>> {
  const rows = await getDb().select({ target: emailSends.target }).from(emailSends).where(sql`${emailSends.kind} = ${MED_KIND}`);
  return new Set(rows.map((r) => r.target));
}

/** Sends the real wording to one address as a test, with a sample code that does nothing; nothing is recorded. */
export async function sendMedTest(to: string): Promise<boolean> {
  const offer = await getMedOffer();
  const first = offer.recipients[0];
  const letter = await renderMedLetter(offer, { name: first?.name ?? "Мария Иванова", email: to, code: "BLA-ПРИМЕР" });
  const id = await sendSequenceMail({ to, ...letter, subject: `[тест] ${letter.subject}` });
  return id !== null;
}

/** Sends to everyone who has not had it. Returns how many went and how many are left. */
export async function sendMedOffer(): Promise<{ sent: number; failed: number; remaining: number }> {
  const offer = await ensureCodes(await getMedOffer());
  const db = getDb();
  let sent = 0;
  let failed = 0;
  for (const r of offer.recipients) {
    if (!r.code) {
      failed++;
      continue;
    }
    const [claim] = await db
      .insert(emailSends)
      .values({ kind: MED_KIND, target: r.email, email: r.email })
      .onConflictDoNothing()
      .returning({ id: emailSends.id });
    if (!claim) continue; // already sent, or being sent
    const letter = await renderMedLetter(offer, r);
    const emailId = await sendSequenceMail({
      to: r.email,
      ...letter,
      unsubscribe: { url: unsubscribeUrl(r.email), postUrl: unsubscribePostUrl(r.email) },
    });
    if (emailId === null) {
      await db.delete(emailSends).where(sql`${emailSends.id} = ${claim.id}`);
      failed++;
    } else {
      await db.update(emailSends).set({ emailId: emailId || null }).where(sql`${emailSends.id} = ${claim.id}`);
      sent++;
    }
  }
  const done = await sentTo();
  return { sent, failed, remaining: offer.recipients.filter((r) => !done.has(r.email)).length };
}
