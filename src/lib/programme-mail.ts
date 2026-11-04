import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { emailSends, orders, tickets } from "@/lib/db/schema";
import { sendListMailBatch, sendSequenceMail } from "@/lib/email";
import { getProgram } from "@/lib/program-data";
import { type ProgrammeTicket, handoverAskLetter, programmeLetter } from "@/lib/sequence-letters";
import { SOLD } from "@/lib/sold";
import { getTier } from "@/lib/tickets";
import { unsubscribePostUrl, unsubscribeUrl } from "@/lib/unsubscribe";

/**
 * The programme letter: one per buyer's address, whatever the number of
 * orders on it, sent by hand from the admin in batches of a hundred. Each
 * address is written down as its batch is accepted, so a second press
 * continues where the first stopped and nobody gets it twice.
 */
export const PROGRAMME_KIND = "programme-mail";

type Buyer = { email: string; name: string; lang: "bg" | "en"; tickets: ProgrammeTicket[] };

/** Every address with a paid, real order, with the name from its latest order. */
async function buyers(): Promise<Buyer[]> {
  const rows = await getDb().execute<{ email: string; name: string; lang: string }>(sql`
    select distinct on (lower(${orders.email})) lower(${orders.email}) as email, ${orders.name} as name, ${orders.lang} as lang
    from ${orders}
    where ${orders.status} = 'paid' and not ${orders.isTest}
      -- An order without a usable address (a bank transfer typed in by hand)
      -- would make the provider refuse the whole batch of a hundred.
      and ${orders.email} ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    order by lower(${orders.email}), ${orders.createdAt} desc`);
  // Every ticket the address bought, so a buyer of several sees them all and can hand each on.
  const tix = await getDb()
    .select({ email: sql<string>`lower(${orders.email})`, code: tickets.code, tierId: tickets.tierId, attendeeName: tickets.attendeeName, attendeeEmail: tickets.attendeeEmail })
    .from(tickets)
    .innerJoin(orders, sql`${orders.id} = ${tickets.orderId}`)
    .where(sql`${SOLD} and not ${orders.isTest}`)
    .orderBy(tickets.code);
  const by = new Map<string, ProgrammeTicket[]>();
  for (const t of tix) {
    const list = by.get(t.email) ?? [];
    list.push({ code: t.code, tierName: getTier(t.tierId)?.name ?? t.tierId, attendeeName: t.attendeeName, attendeeEmail: t.attendeeEmail });
    by.set(t.email, list);
  }
  return [...rows].map((r) => ({ email: r.email, name: r.name, lang: r.lang === "en" ? ("en" as const) : ("bg" as const), tickets: by.get(r.email) ?? [] }));
}

async function sentSet(): Promise<Set<string>> {
  const rows = await getDb().select({ target: emailSends.target }).from(emailSends).where(sql`${emailSends.kind} = ${PROGRAMME_KIND}`);
  return new Set(rows.map((r) => r.target));
}

/** Two made-up tickets, so the preview and the test show the part a buyer of several sees. */
const SAMPLE_TICKETS: ProgrammeTicket[] = [
  { code: "ABCD-EFGH", tierName: "PLUS", attendeeName: "Мария Иванова", attendeeEmail: null },
  { code: "JKLM-NPQR", tierName: "PLUS", attendeeName: null, attendeeEmail: null },
];

export async function programmeAudience(): Promise<{ waiting: number; sent: number }> {
  const [all, done] = await Promise.all([buyers(), sentSet()]);
  const waiting = all.filter((b) => !done.has(b.email)).length;
  return { waiting, sent: all.length - waiting };
}

/** The letter with a sample name, for the preview on the admin page. */
export async function programmePreview(): Promise<{ subject: string; html: string }> {
  const l = programmeLetter({ name: "Мария", days: await getProgram("bg"), unsubUrl: "#", tickets: SAMPLE_TICKETS });
  return { subject: l.subject, html: l.html };
}

export async function sendProgrammeTest(to: string): Promise<boolean> {
  const l = programmeLetter({ name: "Мария", days: await getProgram("bg"), unsubUrl: unsubscribeUrl(to), tickets: SAMPLE_TICKETS });
  const id = await sendSequenceMail({ to, ...l, unsubscribe: { url: unsubscribeUrl(to), postUrl: unsubscribePostUrl(to) } });
  return id !== null;
}

/** Sends to everyone still waiting; stops at the first failed batch and says how many are left. */
export async function sendProgrammeAll(): Promise<{ sent: number; remaining: number; error?: string }> {
  const days = { bg: await getProgram("bg"), en: await getProgram("en") };
  const done = await sentSet();
  const waiting = (await buyers()).filter((b) => !done.has(b.email));
  let sent = 0;
  for (let i = 0; i < waiting.length; i += 100) {
    const slice = waiting.slice(i, i + 100);
    const letters = slice.map((b) => ({ b, l: programmeLetter({ name: b.name, days: days[b.lang], unsubUrl: unsubscribeUrl(b.email), tickets: b.tickets, lang: b.lang }) }));
    const res = await sendListMailBatch(
      letters.map(({ b, l }) => ({ to: b.email, name: null, subject: l.subject, body: "", ctaLabel: null, ctaUrl: null, html: l.html, text: l.text })),
    );
    if (!res.ok) return { sent, remaining: waiting.length - sent, error: res.error };
    await getDb()
      .insert(emailSends)
      .values(letters.map(({ b }, j) => ({ kind: PROGRAMME_KIND, target: b.email, email: b.email, emailId: res.ids?.[j] ?? null })))
      .onConflictDoNothing();
    sent += slice.length;
  }
  return { sent, remaining: 0 };
}

/* ------------------------------------------------------------------ *
 * "Register your ticket", to every buyer
 * ------------------------------------------------------------------ */

export const HANDOVER_KIND = "register-tickets";

async function handoverSent(): Promise<Set<string>> {
  const rows = await getDb().select({ target: emailSends.target }).from(emailSends).where(sql`${emailSends.kind} = ${HANDOVER_KIND}`);
  return new Set(rows.map((r) => r.target));
}

/** Every buyer's address, how many have several tickets, and how many tickets still have nobody's name on them. */
export async function handoverAudience(): Promise<{ waiting: number; sent: number; tickets: number; unnamed: number; several: number }> {
  const [all, done] = await Promise.all([buyers(), handoverSent()]);
  const tickets = all.flatMap((b) => b.tickets);
  return {
    waiting: all.filter((b) => b.tickets.length > 0 && !done.has(b.email)).length,
    sent: all.filter((b) => done.has(b.email)).length,
    tickets: tickets.length,
    unnamed: tickets.filter((t) => !t.attendeeName).length,
    several: all.filter((b) => b.tickets.length > 1).length,
  };
}

export async function handoverPreview(): Promise<{ subject: string; html: string }> {
  const l = handoverAskLetter({ name: "Мария", tickets: SAMPLE_TICKETS, unsubUrl: "#" });
  return { subject: l.subject, html: l.html };
}

export async function sendHandoverTest(to: string): Promise<boolean> {
  const l = handoverAskLetter({ name: "Мария", tickets: SAMPLE_TICKETS, unsubUrl: unsubscribeUrl(to) });
  const id = await sendSequenceMail({ to, ...l, unsubscribe: { url: unsubscribeUrl(to), postUrl: unsubscribePostUrl(to) } });
  return id !== null;
}

export async function sendHandoverAll(): Promise<{ sent: number; remaining: number; error?: string }> {
  const done = await handoverSent();
  const waiting = (await buyers()).filter((b) => b.tickets.length > 0 && !done.has(b.email));
  let sent = 0;
  for (let i = 0; i < waiting.length; i += 100) {
    const slice = waiting.slice(i, i + 100);
    const letters = slice.map((b) => ({ b, l: handoverAskLetter({ name: b.name, tickets: b.tickets, unsubUrl: unsubscribeUrl(b.email), lang: b.lang }) }));
    const res = await sendListMailBatch(
      letters.map(({ b, l }) => ({ to: b.email, name: null, subject: l.subject, body: "", ctaLabel: null, ctaUrl: null, html: l.html, text: l.text })),
    );
    if (!res.ok) return { sent, remaining: waiting.length - sent, error: res.error };
    await getDb()
      .insert(emailSends)
      .values(letters.map(({ b }, j) => ({ kind: HANDOVER_KIND, target: b.email, email: b.email, emailId: res.ids?.[j] ?? null })))
      .onConflictDoNothing();
    sent += slice.length;
  }
  return { sent, remaining: 0 };
}
