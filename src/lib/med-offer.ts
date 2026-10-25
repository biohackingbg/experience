import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { emailSends } from "@/lib/db/schema";
import { sendSequenceMail } from "@/lib/email";
import { getBankDetails } from "@/lib/manual-orders";
import { type Letter, plainLetter } from "@/lib/sequence-letters";
import { getSetting, setSetting } from "@/lib/settings";
import { unsubscribePostUrl, unsubscribeUrl } from "@/lib/unsubscribe";

/**
 * The letter to people who bought a ticket for the medical conference and
 * cannot go - it is for doctors - and are passing the 50 € on to us.
 *
 * Kept as a setting, not a table: a short list that the team edits by hand,
 * with the wording beside it. The send is claimed per address in email_sends
 * under kind "med-offer", so pressing the button again, or after adding one
 * more person, writes only to those who have not had it.
 */
export const MED_KIND = "med-offer";

export type MedRecipient = { name: string; email: string };
export type MedOffer = { recipients: MedRecipient[]; subject: string; body: string };

export const DEFAULT_SUBJECT = "Билетът ви за медицинската конференция и какво можем да направим с него";

/** {{name}} is the first name; {{holder}}, {{iban}}, {{bic}} and {{bank}} come from the bank details in the admin. */
export const DEFAULT_BODY = `Здравей, {{name}}!

Купили сте билет за медицинската конференция на Bulgarian Longevity Association за 50 €. Тя е само за лекари и затова не можете да присъствате. Благодарим ви, че ще пренасочите тази сума към Sofia Life Summit - феста, който е в същите дни, 7-8 ноември, и е за всички, без нужда от медицинско образование.

Ето какво можем да направим с нея:

**Вариант 1 · два билета CORE за 50 €**
Един ден по избор за всеки билет (събота или неделя), лекции при наличие на места и партньорски оферти. Преведете 50 € и ни кажете за кои дни.

**Вариант 2 · билет PLUS за 110 € (доплащате 60 €)**
- И двата дни
- Приоритетен достъп до лекциите
- Работилниците са включени
- 1 специално преживяване по избор
- Goody bag на стойност над 100 €

**Вариант 3 · билет PEAK за 299 € (доплащате 249 €)**
- Гарантиран достъп и премиум зона
- Premium Lounge и Meet & Greet с лектори
- Приоритетен вход, работилници и преживявания с приоритет
- Goody bag на стойност над 250 €

Цените са тези до 25 октомври и ги запазваме за вас до 31 октомври.

Отговорете на това писмо с избора си и преведете сумата по сметка:
{{holder}}
IBAN: {{iban}}
BIC: {{bic}}, {{bank}}
Основание: Sofia Life Summit и вашето име

Щом получим превода, ви изпращаме билетите и фактура. Ако имате въпрос, просто отговорете.`;

const KEY = "med_offer" as const;

export async function getMedOffer(): Promise<MedOffer> {
  const row = await getSetting(KEY);
  const empty: MedOffer = { recipients: [], subject: DEFAULT_SUBJECT, body: DEFAULT_BODY };
  if (!row) return empty;
  try {
    const v = JSON.parse(row.value) as Partial<MedOffer>;
    return {
      recipients: Array.isArray(v.recipients) ? v.recipients.filter((r) => r && typeof r.email === "string") : [],
      subject: v.subject?.trim() || DEFAULT_SUBJECT,
      body: v.body?.trim() || DEFAULT_BODY,
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

async function fill(body: string, name: string): Promise<string> {
  const b = await getBankDetails();
  const first = name.trim().split(/\s+/)[0] || name;
  return body
    .replaceAll("{{name}}", first)
    .replaceAll("{{holder}}", b.holder || "[получател - попълни в банковите данни]")
    .replaceAll("{{iban}}", b.iban || "[IBAN - попълни в банковите данни]")
    .replaceAll("{{bic}}", b.bic || "-")
    .replaceAll("{{bank}}", b.bank || "-");
}

export async function renderMedLetter(offer: MedOffer, r: MedRecipient): Promise<Letter> {
  return plainLetter({
    subject: offer.subject,
    text: await fill(offer.body, r.name),
    why: "Получавате това писмо, защото сте купили билет за медицинската конференция.",
    unsubUrl: unsubscribeUrl(r.email),
  });
}

export async function sentTo(): Promise<Set<string>> {
  const rows = await getDb().select({ target: emailSends.target }).from(emailSends).where(sql`${emailSends.kind} = ${MED_KIND}`);
  return new Set(rows.map((r) => r.target));
}

/** Sends the real letter to one address as a test; nothing is recorded. */
export async function sendMedTest(to: string): Promise<boolean> {
  const offer = await getMedOffer();
  const letter = await renderMedLetter(offer, offer.recipients[0] ?? { name: "Мария Иванова", email: to });
  const id = await sendSequenceMail({ to, ...letter, subject: `[тест] ${letter.subject}` });
  return id !== null;
}

/** Sends to everyone who has not had it. Returns how many went and how many are left. */
export async function sendMedOffer(): Promise<{ sent: number; failed: number; remaining: number }> {
  const offer = await getMedOffer();
  const db = getDb();
  let sent = 0;
  let failed = 0;
  for (const r of offer.recipients) {
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
