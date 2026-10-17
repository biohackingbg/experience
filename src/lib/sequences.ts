import "server-only";

import { sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { emailSends, listMailings, orderItems, orders, signups, tickets } from "@/lib/db/schema";
import { sendListMailBatch, sendSequenceMail } from "@/lib/email";
import { remindAbandonedOrder } from "@/lib/abandoned";
import { getRemaining } from "@/lib/orders";
import { type Pricing, getPricing, priceOf } from "@/lib/pricing";
import {
  LIST_LETTERS,
  type Letter,
  type ListLetterId,
  type UpgradeStep,
  abandoned2,
  checkinLetter,
  listLetter,
  upgradeLetter,
} from "@/lib/sequence-letters";
import { getArrivalPlan, ordersWithoutArrival } from "@/lib/arrivals";
import { getSetting, setSetting } from "@/lib/settings";
import { SOLD } from "@/lib/sold";
import { type Tier, getTier } from "@/lib/tickets";
import { unsubscribePostUrl, unsubscribeUrl } from "@/lib/unsubscribe";
import { upgradableTickets } from "@/lib/upgrades";

/**
 * The automatic letters, run once an hour by Vercel Cron (/api/cron/pisma).
 *
 * Four sequences: the abandoned checkout (the existing reminder at +24 h,
 * then one last nudge at +72 h), CORE → PLUS (day 0, day 5, three days
 * before), PLUS → PEAK (once, ten days before), and the news-list letters
 * on their dates. Every send is claimed in email_sends before it goes, so
 * a run that is cut off cannot send the same letter twice - and the
 * dashboard reads the same rows for its numbers.
 *
 * Every letter is off until someone switches it on from the dashboard, one
 * by one: these letters go to real people, and the first run would
 * otherwise write to every CORE buyer at once before anyone read the words.
 */

const DAYS_KEPT = 14;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** Day 0 waits two hours, so the ticket mail is read first; after three days it is day 5's turn. */
const PLUS_0_FROM = 2 * HOUR;
const PLUS_0_UNTIL = 3 * DAY;
const PLUS_5_FROM = 5 * DAY;
const PLUS_3D_AT = new Date("2026-11-04T09:00:00+02:00");
const PEAK_AT = new Date("2026-10-28T09:00:00+02:00");
const CHECKIN_AT = new Date("2026-11-02T10:00:00+02:00");
/** Upgrade letters stop the morning of the event. */
const EVENT_AT = new Date("2026-11-07T07:00:00+02:00");
/** A dated letter that was missed by more than this is dropped, not sent late. */
const LIST_GRACE = 36 * HOUR;
/** Per run, so a backlog cannot run the function past its minute. */
const PER_RUN = 60;

export const SEQUENCE_KINDS = [
  { kind: "abandoned-1", title: "Недовършена поръчка · напомняне", when: "24 ч след началото на поръчката, ако не е платена." },
  { kind: "abandoned-2", title: "Недовършена поръчка · последно", when: "48 ч след първото напомняне, ако още не е платена. Последното писмо." },
  { kind: "upgrade-plus-0", title: "CORE → PLUS · ден 0", when: "2 ч след покупка на CORE (до 3 дни след нея)." },
  { kind: "upgrade-plus-5", title: "CORE → PLUS · ден 5", when: "5 дни след покупката. Купилите преди пускането го получават на първия пуск." },
  { kind: "upgrade-plus-3d", title: "CORE → PLUS · 3 дни преди", when: "4 ноември от 09:00, на всеки, който още е с CORE." },
  { kind: "upgrade-peak", title: "PLUS → PEAK", when: "28 октомври от 09:00, веднъж, докато има места в PEAK." },
  { kind: "checkin", title: "Избери час за влизане", when: "2 ноември от 10:00, на всеки с билет без избран час. Само ако входът на вълни е пуснат от Вход." },
  ...LIST_LETTERS.map((l) => ({ kind: `list-${l.id}`, title: `Списък · ${l.title}`, when: sofia(l.at) })),
] as const;

export type SequenceKind = (typeof SEQUENCE_KINDS)[number]["kind"];

export function sofia(d: Date): string {
  return d.toLocaleString("bg-BG", { timeZone: "Europe/Sofia", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

/* ------------------------------------------------------------------ *
 * Switch
 * ------------------------------------------------------------------ */

/**
 * Per letter: whether it runs at all, the day it may start (so a sequence
 * can wait for the price stage to pass), and for a dated list letter its
 * own date and time instead of the one in code. Dates are Sofia days.
 */
export type KindConfig = { on: boolean; from: string | null; at: string | null };
export type SequenceConfig = Record<string, KindConfig>;

// Every letter is off until someone switches it on in the dashboard.
const DEFAULT_KIND: KindConfig = { on: false, from: null, at: null };

export async function getSequenceConfig(): Promise<SequenceConfig> {
  // v2: the key changed when the master switch went away, so every letter
  // starts off and is switched on knowingly, one by one.
  const raw = (await getSetting("sequences_config_v2"))?.value;
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as Record<string, Partial<KindConfig>>;
    const out: SequenceConfig = {};
    for (const [k, c] of Object.entries(v)) out[k] = { on: c.on === true, from: c.from || null, at: c.at || null };
    return out;
  } catch {
    return {};
  }
}

export async function saveKindConfig(kind: string, patch: Partial<KindConfig>): Promise<void> {
  const cfg = await getSequenceConfig();
  cfg[kind] = { ...DEFAULT_KIND, ...(cfg[kind] ?? {}), ...patch };
  await setSetting("sequences_config_v2", JSON.stringify(cfg));
}

/** Midnight of a Sofia day (YYYY-MM-DD), whichever side of the clock change it falls. */
export function sofiaMidnight(day: string): Date {
  const guess = new Date(`${day}T00:00:00+02:00`);
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Sofia", hour: "2-digit", hour12: false }).format(guess));
  return h === 1 ? new Date(guess.getTime() - HOUR) : guess;
}

/** A local date-time typed in the admin ("2026-10-26T09:00"), read as Sofia time. */
export function sofiaTime(local: string): Date {
  const [day, time = "09:00"] = local.split("T");
  const [hh, mm] = time.split(":").map(Number);
  return new Date(sofiaMidnight(day).getTime() + (hh * 60 + (mm || 0)) * 60_000);
}

/** Why the hourly run would leave this letter alone right now, or null to go ahead. */
function gate(kind: string, cfg: SequenceConfig, now: Date): string | null {
  const c = cfg[kind] ?? DEFAULT_KIND;
  if (!c.on) return "изключено";
  if (c.from && now < sofiaMidnight(c.from)) return `чака до ${c.from.split("-").reverse().join(".")}`;
  return null;
}

/* ------------------------------------------------------------------ *
 * Bookkeeping
 * ------------------------------------------------------------------ */

async function optedOut(emails: string[]): Promise<Set<string>> {
  if (emails.length === 0) return new Set();
  const rows = await getDb()
    .select({ email: signups.email })
    .from(signups)
    .where(sql`${signups.unsubscribedAt} is not null and lower(${signups.email}) in (${sql.join(emails.map((e) => sql`${e.toLowerCase()}`), sql`, `)})`);
  return new Set(rows.map((r) => r.email.toLowerCase()));
}

/** Takes the (kind, target) slot; null if some earlier run already has it. */
async function claim(kind: string, target: string, email: string): Promise<string | null> {
  const [row] = await getDb()
    .insert(emailSends)
    .values({ kind, target, email: email.toLowerCase() })
    .onConflictDoNothing()
    .returning({ id: emailSends.id });
  return row?.id ?? null;
}

async function settle(id: string, emailId: string | null): Promise<void> {
  const db = getDb();
  if (emailId === null) await db.delete(emailSends).where(sql`${emailSends.id} = ${id}`);
  else await db.update(emailSends).set({ emailId: emailId || null }).where(sql`${emailSends.id} = ${id}`);
}

const unsub = (email: string) => ({ url: unsubscribeUrl(email), postUrl: unsubscribePostUrl(email) });

/** Sends one letter under a claimed slot; false when the slot was taken or the send failed. */
async function deliver(kind: string, target: string, to: string, letter: Letter, dry: boolean): Promise<boolean> {
  if (dry) return true;
  const id = await claim(kind, target, to);
  if (!id) return false;
  const emailId = await sendSequenceMail({ to, ...letter, unsubscribe: unsub(to) });
  await settle(id, emailId);
  return emailId !== null;
}

/* ------------------------------------------------------------------ *
 * 1 · Abandoned checkouts
 * ------------------------------------------------------------------ */

const abandonedBase = sql`${orders.status} = 'pending' and not ${orders.isTest} and ${orders.paymentMethod} = 'card'
  and ${orders.upgradesTicketCode} is null
  and ${orders.createdAt} > now() - interval '${sql.raw(String(DAYS_KEPT))} days'
  and not exists (select 1 from ${orders} p where p.email = orders.email and p.status = 'paid')`;

async function runAbandoned1(dry: boolean): Promise<Step> {
  const rows = await getDb()
    .select({ reference: orders.reference, email: orders.email })
    .from(orders)
    .where(sql`${abandonedBase} and ${orders.reminderSentAt} is null and ${orders.createdAt} <= now() - interval '24 hours'`)
    .limit(PER_RUN);
  const out = await optedOut(rows.map((r) => r.email));
  const to: string[] = [];
  for (const r of rows) {
    if (out.has(r.email.toLowerCase())) continue;
    if (dry) {
      to.push(r.email);
      continue;
    }
    const res = await remindAbandonedOrder(r.reference);
    if (res.ok) to.push(res.to);
  }
  return { kind: "abandoned-1", sent: to.length, to };
}

async function runAbandoned2(dry: boolean, pricing: Pricing): Promise<Step> {
  const db = getDb();
  const rows = await db
    .select({ id: orders.id, reference: orders.reference, name: orders.name, email: orders.email })
    .from(orders)
    .where(
      sql`${abandonedBase} and ${orders.reminderSentAt} <= now() - interval '48 hours'
        and not exists (select 1 from ${emailSends} s where s.kind = 'abandoned-2' and s.target = ${orders.reference})`,
    )
    .limit(PER_RUN);
  const out = await optedOut(rows.map((r) => r.email));
  const to: string[] = [];
  for (const r of rows) {
    if (out.has(r.email.toLowerCase())) continue;
    const items = await db
      .select({ tierId: orderItems.tierId, tierName: orderItems.tierName, quantity: orderItems.quantity })
      .from(orderItems)
      .where(sql`${orderItems.orderId} = ${r.id}`);
    const letter = abandoned2({
      name: r.name,
      reference: r.reference,
      items: items.map((i) => `${i.quantity}× ${i.tierName}`).join(", ") || "билет",
      tierId: items[0]?.tierId ?? "plus",
      pricing,
      unsubUrl: unsubscribeUrl(r.email),
    });
    if (await deliver("abandoned-2", r.reference, r.email, letter, dry)) to.push(r.email);
  }
  return { kind: "abandoned-2", sent: to.length, to };
}

/* ------------------------------------------------------------------ *
 * 2 + 3 · Upgrades
 * ------------------------------------------------------------------ */

type UpgradeRule = { kind: string; step: UpgradeStep; from: Tier; to: Tier; at: Date | null; where: () => ReturnType<typeof sql> };

function upgradeRules(): UpgradeRule[] {
  const core = getTier("core")!;
  const plus = getTier("plus")!;
  const peak = getTier("peak")!;
  const age = (ms: number) => sql.raw(`'${Math.round(ms / 1000)} seconds'`);
  const noOther = (prefix: string) =>
    sql`not exists (select 1 from ${emailSends} s where s.kind like ${prefix + "%"} and s.target = ${orders.reference})`;
  // Day 0 only when no upgrade letter at all has gone for the order.
  return [
    {
      kind: "upgrade-plus-0", step: "plus-0", from: core, to: plus, at: null,
      where: () => sql`${orders.paidAt} <= now() - interval ${age(PLUS_0_FROM)} and ${orders.paidAt} > now() - interval ${age(PLUS_0_UNTIL)} and ${noOther("upgrade-plus")}`,
    },
    {
      kind: "upgrade-plus-5", step: "plus-5", from: core, to: plus, at: null,
      where: () => sql`${orders.paidAt} <= now() - interval ${age(PLUS_5_FROM)} and not exists (select 1 from ${emailSends} s where s.kind in ('upgrade-plus-5', 'upgrade-plus-3d') and s.target = ${orders.reference})`,
    },
    {
      kind: "upgrade-plus-3d", step: "plus-3d", from: core, to: plus, at: PLUS_3D_AT,
      where: () => sql`not exists (select 1 from ${emailSends} s where s.kind = 'upgrade-plus-3d' and s.target = ${orders.reference})`,
    },
    {
      kind: "upgrade-peak", step: "peak", from: plus, to: peak, at: PEAK_AT,
      where: () => sql`not exists (select 1 from ${emailSends} s where s.kind = 'upgrade-peak' and s.target = ${orders.reference})`,
    },
  ];
}

async function runUpgrade(rule: UpgradeRule, dry: boolean, now: Date, pricing: Pricing, force: boolean): Promise<Step> {
  if (now >= EVENT_AT) return { kind: rule.kind, sent: 0, skipped: "събитието започна" };
  if (!force && rule.at && now < rule.at) return { kind: rule.kind, sent: 0, skipped: `от ${sofia(rule.at)}` };
  const extra = rule.where();
  const left = await getRemaining(rule.to.id);
  if (left < 1) return { kind: rule.kind, sent: 0, skipped: `${rule.to.name} е изчерпан` };

  const db = getDb();
  // Orders with at least one ticket of the lower tier that is still unused;
  // the upgrade orders themselves (upgradesTicketCode) never qualify.
  const rows = await db
    .select({ id: orders.id, reference: orders.reference, name: orders.name, email: orders.email })
    .from(orders)
    .where(
      sql`${SOLD} and ${orders.upgradesTicketCode} is null and ${orders.totalCents} > 0
        and exists (select 1 from ${tickets} t where t.order_id = ${orders.id} and t.tier_id = ${rule.from.id} and t.checked_in_at is null)
        and ${extra}`,
    )
    .orderBy(orders.paidAt)
    .limit(PER_RUN);
  const out = await optedOut(rows.map((r) => r.email));
  const targetCents = priceOf(pricing, rule.to);
  const to: string[] = [];
  for (const r of rows) {
    if (out.has(r.email.toLowerCase())) continue;
    const list = await upgradableTickets(r.id, rule.from, targetCents);
    if (list.length === 0) continue;
    const letter = upgradeLetter(
      { name: r.name, from: rule.from, to: rule.to, tickets: list, left, pricing, unsubUrl: unsubscribeUrl(r.email) },
      rule.step,
    );
    if (await deliver(rule.kind, r.reference, r.email, letter, dry)) to.push(r.email);
  }
  return { kind: rule.kind, sent: to.length, to };
}

/* ------------------------------------------------------------------ *
 * 3b · Pick your arrival time
 * ------------------------------------------------------------------ */

async function runCheckin(dry: boolean, now: Date, force: boolean): Promise<Step> {
  const kind = "checkin";
  if (now >= EVENT_AT) return { kind, sent: 0, skipped: "събитието започна" };
  if (!force && now < CHECKIN_AT) return { kind, sent: 0, skipped: `от ${sofia(CHECKIN_AT)}` };
  if (!(await getArrivalPlan()).on) return { kind, sent: 0, skipped: "входът на вълни не е пуснат" };
  const all = await ordersWithoutArrival();
  const sent = await getDb().select({ target: emailSends.target }).from(emailSends).where(sql`${emailSends.kind} = ${kind}`);
  const done = new Set(sent.map((r) => r.target));
  const rows = all.filter((o) => !done.has(o.reference)).slice(0, PER_RUN);
  const out = await optedOut(rows.map((r) => r.email));
  const to: string[] = [];
  for (const r of rows) {
    if (out.has(r.email.toLowerCase())) continue;
    const letter = checkinLetter({ name: r.name, codes: r.codes, unsubUrl: unsubscribeUrl(r.email) });
    if (await deliver(kind, r.reference, r.email, letter, dry)) to.push(r.email);
  }
  return { kind, sent: to.length, to };
}

/* ------------------------------------------------------------------ *
 * 4 · The news list, on its dates
 * ------------------------------------------------------------------ */

/** The news list minus everyone who already bought: they have their own letters. */
async function listRecipients(): Promise<{ email: string; name: string | null }[]> {
  const db = getDb();
  const rows = await db
    .select({ email: signups.email, name: signups.name })
    .from(signups)
    .where(
      sql`${signups.unsubscribedAt} is null and coalesce(${signups.source}, '') not like 'waitlist%'
        and not exists (select 1 from ${orders} o where lower(o.email) = lower(${signups.email}) and o.status = 'paid' and not o.is_test)`,
    );
  return rows;
}

async function listSent(id: ListLetterId): Promise<"sent" | "skipped" | null> {
  const [row] = await getDb()
    .select({ email: emailSends.email })
    .from(emailSends)
    .where(sql`${emailSends.kind} = ${"list-" + id} and ${emailSends.target} = ${"list:" + id}`)
    .limit(1);
  return row ? (row.email === "skipped" ? "skipped" : "sent") : null;
}

/** "Не пращай това писмо": takes the slot so the run walks past it. */
export async function skipListLetter(id: ListLetterId, undo = false): Promise<void> {
  const db = getDb();
  if (undo) {
    await db.delete(emailSends).where(sql`${emailSends.kind} = ${"list-" + id} and ${emailSends.target} = ${"list:" + id} and ${emailSends.email} = 'skipped'`);
    return;
  }
  await db.insert(emailSends).values({ kind: `list-${id}`, target: `list:${id}`, email: "skipped" }).onConflictDoNothing();
}

/** When a list letter goes: the admin's date if one was typed, else the one in code. */
export function listLetterAt(id: ListLetterId, cfg: SequenceConfig): Date {
  const own = cfg[`list-${id}`]?.at;
  return own ? sofiaTime(own) : LIST_LETTERS.find((l) => l.id === id)!.at;
}

async function runList(dry: boolean, now: Date, pricing: Pricing, cfg: SequenceConfig, force: boolean, only?: string): Promise<Step[]> {
  const out: Step[] = [];
  for (const def of LIST_LETTERS) {
    const kind = `list-${def.id}`;
    if (only && only !== kind) continue;
    const at = listLetterAt(def.id, cfg);
    const state = await listSent(def.id);
    if (state) {
      out.push({ kind, sent: 0, skipped: state === "sent" ? "изпратено" : "пропуснато" });
      continue;
    }
    if (!force) {
      const why = gate(kind, cfg, now);
      if (why) {
        out.push({ kind, sent: 0, skipped: why });
        continue;
      }
      if (now < at) {
        out.push({ kind, sent: 0, skipped: `на ${sofia(at)}` });
        continue;
      }
      if (now.getTime() - at.getTime() > LIST_GRACE) {
        out.push({ kind, sent: 0, skipped: "закъсняло с над 36 ч - не се праща" });
        continue;
      }
    }
    if (def.needsDiscount && !pricing.discounted) {
      out.push({ kind, sent: 0, skipped: "междинните цени вече не са на" });
      continue;
    }
    const people = await listRecipients();
    if (dry) {
      out.push({ kind, sent: people.length, to: people.slice(0, 5).map((p) => p.email) });
      continue;
    }
    // One slot for the whole letter, then a row per recipient for the opens.
    const slot = await claim(kind, `list:${def.id}`, "list");
    if (!slot) {
      out.push({ kind, sent: 0, skipped: "изпратено" });
      continue;
    }
    const peakLeft = await getRemaining("peak");
    let sent = 0;
    let error: string | undefined;
    for (let i = 0; i < people.length; i += 100) {
      const slice = people.slice(i, i + 100);
      const letters = slice.map((p) => ({ p, l: listLetter(def.id, { name: p.name, pricing, peakLeft, unsubUrl: unsubscribeUrl(p.email) }) }));
      const res = await sendListMailBatch(
        letters.map(({ p, l }) => ({ to: p.email, name: null, subject: l.subject, body: "", ctaLabel: null, ctaUrl: null, html: l.html, text: l.text })),
      );
      if (!res.ok) {
        error = res.error;
        break;
      }
      const db = getDb();
      await db
        .insert(emailSends)
        .values(letters.map(({ p }, j) => ({ kind, target: p.email.toLowerCase(), email: p.email.toLowerCase(), emailId: res.ids?.[j] ?? null })))
        .onConflictDoNothing();
      sent += slice.length;
    }
    await getDb().insert(listMailings).values({
      audience: "signups",
      subject: listLetter(def.id, { name: null, pricing, peakLeft, unsubUrl: "#" }).subject,
      body: `(автоматично писмо от поредицата: ${def.title})`,
      recipients: sent,
      sentBy: "поредица",
    });
    out.push({ kind, sent, skipped: error ? `спря с грешка: ${error}` : undefined });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * The hourly run
 * ------------------------------------------------------------------ */

export type Step = { kind: string; sent: number; skipped?: string; to?: string[] };

/**
 * `force` is the admin's "send now": the master switch, the per-letter
 * switch and start day, and the dates are all ignored; what still holds is
 * everything that protects a person - one letter per target, the opt-out,
 * sold-out tiers, a price letter after the prices changed. `only` limits
 * the run to one letter.
 */
export async function runSequences(opts: { dry?: boolean; now?: Date; force?: boolean; only?: string } = {}): Promise<{ steps: Step[] }> {
  const dry = !!opts.dry;
  const force = !!opts.force;
  const only = opts.only;
  const now = opts.now ?? new Date();
  const [pricing, cfg] = await Promise.all([getPricing(), getSequenceConfig()]);
  const steps: Step[] = [];
  const wants = (kind: string) => !only || only === kind;
  const gated = (kind: string) => (force ? null : gate(kind, cfg, now));
  const push = async (kind: string, run: () => Promise<Step>) => {
    if (!wants(kind)) return;
    const why = gated(kind);
    steps.push(why ? { kind, sent: 0, skipped: why } : await run());
  };
  await push("abandoned-1", () => runAbandoned1(dry));
  await push("abandoned-2", () => runAbandoned2(dry, pricing));
  for (const rule of upgradeRules()) await push(rule.kind, () => runUpgrade(rule, dry, now, pricing, force));
  await push("checkin", () => runCheckin(dry, now, force));
  steps.push(...(await runList(dry, now, pricing, cfg, force, only)));
  return { steps };
}

/* ------------------------------------------------------------------ *
 * What the dashboard shows
 * ------------------------------------------------------------------ */

export type KindStats = { sent: number; opened: number; clicked: number; converted: number; convertedCents: number; lastAt: Date | null };

/**
 * Per letter: how many went, how many were opened or clicked (what Resend
 * reported back), and how many of those addresses paid an order after the
 * letter - any order, so an upgrade letter followed by an upgrade counts,
 * and a list letter followed by a purchase counts.
 */
export async function sequenceStats(): Promise<Record<string, KindStats>> {
  const rows = await getDb().execute<{
    kind: string; sent: string; opened: string; clicked: string; converted: string; converted_cents: string; last_at: Date | null;
  }>(sql`
    select s.kind,
      count(*) filter (where s.email <> 'skipped' and s.email <> 'list')::text as sent,
      count(*) filter (where s.opened_at is not null)::text as opened,
      count(*) filter (where s.clicked_at is not null)::text as clicked,
      count(*) filter (where c.cents is not null)::text as converted,
      coalesce(sum(c.cents), 0)::text as converted_cents,
      max(s.sent_at) filter (where s.email <> 'skipped') as last_at
    from ${emailSends} s
    left join lateral (
      select sum(o.total_cents - coalesce(o.refunded_cents, 0))::bigint as cents
      from ${orders} o
      where lower(o.email) = s.email and o.status = 'paid' and not o.is_test and o.paid_at >= s.sent_at and o.total_cents > 0
      having count(*) > 0
    ) c on true
    group by s.kind`);
  const out: Record<string, KindStats> = {};
  for (const r of rows) {
    out[r.kind] = { sent: Number(r.sent), opened: Number(r.opened), clicked: Number(r.clicked), converted: Number(r.converted), convertedCents: Number(r.converted_cents), lastAt: r.last_at ? new Date(r.last_at) : null };
  }
  // The first reminder lives on the order row, not in email_sends.
  const [a1] = await getDb()
    .select({
      sent: sql<number>`count(*)::int`,
      opened: sql<number>`count(*) filter (where ${orders.reminderOpenedAt} is not null)::int`,
      clicked: sql<number>`count(*) filter (where ${orders.reminderClickedAt} is not null)::int`,
      converted: sql<number>`count(*) filter (where exists (select 1 from ${orders} p where p.email = orders.email and p.status = 'paid' and p.paid_at >= orders.reminder_sent_at))::int`,
      convertedCents: sql<number>`coalesce(sum((select sum(p.total_cents - coalesce(p.refunded_cents, 0)) from ${orders} p where p.status = 'paid' and not p.is_test and p.paid_at >= orders.reminder_sent_at and p.email = orders.email)), 0)::int`,
      lastAt: sql<Date | null>`max(${orders.reminderSentAt})`,
    })
    .from(orders)
    .where(sql`${orders.reminderSentAt} is not null`);
  if (a1) out["abandoned-1"] = { ...a1, lastAt: a1.lastAt ? new Date(a1.lastAt) : null };
  return out;
}

export async function listLetterStates(): Promise<Record<ListLetterId, "sent" | "skipped" | null>> {
  const out = {} as Record<ListLetterId, "sent" | "skipped" | null>;
  for (const l of LIST_LETTERS) out[l.id] = await listSent(l.id);
  return out;
}

/* ------------------------------------------------------------------ *
 * Previews and test sends, with made-up data
 * ------------------------------------------------------------------ */

export async function sequencePreview(kind: string, to = "ti@example.com"): Promise<Letter | null> {
  const pricing = await getPricing();
  const core = getTier("core")!;
  const plus = getTier("plus")!;
  const peak = getTier("peak")!;
  const u = unsubscribeUrl(to);
  const upgrade = (from: Tier, toTier: Tier, step: UpgradeStep) =>
    upgradeLetter(
      {
        name: "Мария",
        from, to: toTier,
        tickets: [{ code: "AB12-CD34", attendeeName: null, diffCents: priceOf(pricing, toTier) - priceOf(pricing, from) }],
        left: 37, pricing, unsubUrl: u,
      },
      step,
    );
  switch (kind) {
    case "abandoned-2":
      return abandoned2({ name: "Мария", reference: "SLS-ABC123", items: "1× PLUS", tierId: "plus", pricing, unsubUrl: u });
    case "upgrade-plus-0": return upgrade(core, plus, "plus-0");
    case "upgrade-plus-5": return upgrade(core, plus, "plus-5");
    case "upgrade-plus-3d": return upgrade(core, plus, "plus-3d");
    case "upgrade-peak": return upgrade(plus, peak, "peak");
    case "checkin": return checkinLetter({ name: "Мария", codes: ["AB12-CD34"], unsubUrl: u });
  }
  if (kind.startsWith("list-")) {
    const id = kind.slice(5) as ListLetterId;
    if (!LIST_LETTERS.some((l) => l.id === id)) return null;
    return listLetter(id, { name: "Мария", pricing, peakLeft: 23, unsubUrl: u });
  }
  return null;
}

export async function sendSequenceTest(kind: string, to: string): Promise<boolean> {
  const letter = await sequencePreview(kind, to);
  if (!letter) return false;
  const id = await sendSequenceMail({ to, subject: `[проба] ${letter.subject}`, html: letter.html, text: letter.text });
  return id !== null;
}
