import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { orderItems, orders, promoCodes } from "@/lib/db/schema";
import { PENDING_HOLD_MINUTES } from "@/lib/orders-const";

/**
 * Discount codes, resolved against the gross the buyer is about to pay.
 * Every rule is checked here and only here: the checkout preview and the
 * order creation both call this, so a code cannot be worth one thing on the
 * page and another on the invoice.
 */

export type PromoKind = "percent" | "fixed";
export const isPromoKind = (v: unknown): v is PromoKind => v === "percent" || v === "fixed";

export const normaliseCode = (v: string) => v.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);

export type PromoResult =
  | { ok: true; code: string; kind: PromoKind; value: number; discountCents: number; label: string }
  | { ok: false; reason: "unknown" | "inactive" | "expired" | "exhausted" };

export function promoLabel(kind: PromoKind, value: number): string {
  return kind === "percent" ? `-${value} %` : `-${(value / 100).toLocaleString("bg-BG")} €`;
}

export function discountFor(kind: PromoKind, value: number, grossCents: number): number {
  const raw = kind === "percent" ? Math.round((grossCents * value) / 100) : value;
  return Math.max(0, Math.min(grossCents, raw));
}

/** Paid orders on the code, plus checkouts still inside the seat hold. */
async function usesOf(code: string): Promise<number> {
  const [r] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      sql`${orders.promoCode} = ${code} and (
        ${orders.status} = 'paid'
        or (${orders.status} = 'pending' and ${orders.createdAt} > now() - interval '${sql.raw(String(PENDING_HOLD_MINUTES))} minutes')
      )`,
    );
  return r?.n ?? 0;
}

export async function resolvePromo(raw: string, grossCents: number): Promise<PromoResult> {
  const code = normaliseCode(raw);
  if (!code) return { ok: false, reason: "unknown" };
  const [p] = await getDb().select().from(promoCodes).where(eq(promoCodes.code, code)).limit(1);
  if (!p || !isPromoKind(p.kind)) return { ok: false, reason: "unknown" };
  if (!p.active) return { ok: false, reason: "inactive" };
  if (p.validUntil && p.validUntil.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (p.maxUses !== null && (await usesOf(code)) >= p.maxUses) return { ok: false, reason: "exhausted" };
  return {
    ok: true,
    code,
    kind: p.kind,
    value: p.value,
    discountCents: discountFor(p.kind, p.value, grossCents),
    label: promoLabel(p.kind, p.value),
  };
}

export const promoReasonText: Record<Extract<PromoResult, { ok: false }>["reason"], string> = {
  unknown: "Няма такъв код.",
  inactive: "Кодът е спрян.",
  expired: "Срокът на кода е изтекъл.",
  exhausted: "Кодът е използван максималния брой пъти.",
};

export type PromoRow = {
  id: string;
  code: string;
  kind: PromoKind;
  value: number;
  label: string;
  maxUses: number | null;
  validUntil: Date | null;
  note: string | null;
  active: boolean;
  createdAt: Date;
  /** Paid orders that used it. */
  uses: number;
  tickets: number;
  discountCents: number;
  /** What those orders paid after the discount. */
  revenueCents: number;
  expired: boolean;
  exhausted: boolean;
};

export async function listPromos(): Promise<PromoRow[]> {
  const db = getDb();
  const paidWithCode = sql`${orders.promoCode} is not null and ${orders.status} = 'paid' and not ${orders.isTest}`;
  const [codes, usageRows, ticketRows] = await Promise.all([
    db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt)),
    db
      .select({
        code: orders.promoCode,
        uses: sql<number>`count(*)::int`,
        discount: sql<number>`coalesce(sum(${orders.discountCents}), 0)::int`,
        revenue: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
      })
      .from(orders)
      .where(paidWithCode)
      .groupBy(orders.promoCode),
    // Tickets need the items; kept apart so the money sums are not multiplied by them.
    db
      .select({ code: orders.promoCode, tickets: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int` })
      .from(orderItems)
      .innerJoin(orders, sql`${orders.id} = ${orderItems.orderId}`)
      .where(paidWithCode)
      .groupBy(orders.promoCode),
  ]);
  const usage = usageRows.map((u) => ({ ...u, tickets: ticketRows.find((t) => t.code === u.code)?.tickets ?? 0 }));
  const now = Date.now();
  return codes.map((p) => {
    const u = usage.find((x) => x.code === p.code);
    const kind: PromoKind = isPromoKind(p.kind) ? p.kind : "percent";
    return {
      id: p.id,
      code: p.code,
      kind,
      value: p.value,
      label: promoLabel(kind, p.value),
      maxUses: p.maxUses,
      validUntil: p.validUntil,
      note: p.note,
      active: p.active,
      createdAt: p.createdAt,
      uses: u?.uses ?? 0,
      tickets: u?.tickets ?? 0,
      discountCents: u?.discount ?? 0,
      revenueCents: u?.revenue ?? 0,
      expired: !!p.validUntil && p.validUntil.getTime() < now,
      exhausted: p.maxUses !== null && (u?.uses ?? 0) >= p.maxUses,
    };
  });
}

export async function createPromo(input: {
  code: string;
  kind: PromoKind;
  value: number;
  maxUses: number | null;
  validUntil: Date | null;
  note: string | null;
}): Promise<"ok" | "exists"> {
  const rows = await getDb().insert(promoCodes).values(input).onConflictDoNothing({ target: promoCodes.code }).returning({ id: promoCodes.id });
  return rows.length ? "ok" : "exists";
}

export async function setPromoActive(id: string, active: boolean): Promise<void> {
  await getDb().update(promoCodes).set({ active }).where(eq(promoCodes.id, id));
}

/** Only a code nobody has used may be deleted; a used one is switched off instead. */
export async function deletePromo(id: string): Promise<boolean> {
  const db = getDb();
  const [p] = await db.select({ code: promoCodes.code }).from(promoCodes).where(eq(promoCodes.id, id)).limit(1);
  if (!p) return false;
  const [u] = await db.select({ n: sql<number>`count(*)::int` }).from(orders).where(eq(orders.promoCode, p.code));
  if ((u?.n ?? 0) > 0) return false;
  await db.delete(promoCodes).where(eq(promoCodes.id, id));
  return true;
}
