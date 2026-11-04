import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { emailSends, orders } from "@/lib/db/schema";
import { sendListMailBatch, sendSequenceMail } from "@/lib/email";
import { getProgram } from "@/lib/program-data";
import { programmeLetter } from "@/lib/sequence-letters";
import { unsubscribePostUrl, unsubscribeUrl } from "@/lib/unsubscribe";

/**
 * The programme letter: one per buyer's address, whatever the number of
 * orders on it, sent by hand from the admin in batches of a hundred. Each
 * address is written down as its batch is accepted, so a second press
 * continues where the first stopped and nobody gets it twice.
 */
export const PROGRAMME_KIND = "programme-mail";

type Buyer = { email: string; name: string };

/** Every address with a paid, real order, with the name from its latest order. */
async function buyers(): Promise<Buyer[]> {
  const rows = await getDb().execute<{ email: string; name: string }>(sql`
    select distinct on (lower(${orders.email})) lower(${orders.email}) as email, ${orders.name} as name
    from ${orders}
    where ${orders.status} = 'paid' and not ${orders.isTest}
    order by lower(${orders.email}), ${orders.createdAt} desc`);
  return [...rows].map((r) => ({ email: r.email, name: r.name }));
}

async function sentSet(): Promise<Set<string>> {
  const rows = await getDb().select({ target: emailSends.target }).from(emailSends).where(sql`${emailSends.kind} = ${PROGRAMME_KIND}`);
  return new Set(rows.map((r) => r.target));
}

export async function programmeAudience(): Promise<{ waiting: number; sent: number }> {
  const [all, done] = await Promise.all([buyers(), sentSet()]);
  const waiting = all.filter((b) => !done.has(b.email)).length;
  return { waiting, sent: all.length - waiting };
}

/** The letter with a sample name, for the preview on the admin page. */
export async function programmePreview(): Promise<{ subject: string; html: string }> {
  const l = programmeLetter({ name: "Мария", days: await getProgram("bg"), unsubUrl: "#" });
  return { subject: l.subject, html: l.html };
}

export async function sendProgrammeTest(to: string): Promise<boolean> {
  const l = programmeLetter({ name: "Мария", days: await getProgram("bg"), unsubUrl: unsubscribeUrl(to) });
  const id = await sendSequenceMail({ to, ...l, unsubscribe: { url: unsubscribeUrl(to), postUrl: unsubscribePostUrl(to) } });
  return id !== null;
}

/** Sends to everyone still waiting; stops at the first failed batch and says how many are left. */
export async function sendProgrammeAll(): Promise<{ sent: number; remaining: number; error?: string }> {
  const days = await getProgram("bg");
  const done = await sentSet();
  const waiting = (await buyers()).filter((b) => !done.has(b.email));
  let sent = 0;
  for (let i = 0; i < waiting.length; i += 100) {
    const slice = waiting.slice(i, i + 100);
    const letters = slice.map((b) => ({ b, l: programmeLetter({ name: b.name, days, unsubUrl: unsubscribeUrl(b.email) }) }));
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
