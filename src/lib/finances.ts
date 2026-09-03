import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { budgets, deckLinks, expenses, orders } from "@/lib/db/schema";
import { CATEGORIES, EXPENSE_STATUS, MONEY, TIERS, categoryLabel, type CategoryId, type ExpenseStatus } from "@/lib/finance-options";

/**
 * The organisers' view of the money - not the books.
 *
 * Everything here is net of VAT: ticket revenue is already split, sponsor
 * deals are entered net, costs are entered net. Mixing gross and net is how
 * a "result" ends up wrong by a fifth. The accountant's software remains the
 * source of truth; this page answers three questions at a glance - what
 * comes in, what goes out, and whether the event is in the black - and one
 * more that matters for an event: how much of it is actually in the bank.
 */

export { CATEGORIES, EXPENSE_STATUS, isCategory, isExpenseStatus, categoryLabel } from "@/lib/finance-options";
export type { CategoryId, ExpenseStatus } from "@/lib/finance-options";

export type SponsorRow = {
  id: string;
  label: string;
  tier: string | null;
  amountCents: number;
  money: string | null;
  owner: string | null;
};

export type ExpenseRow = {
  id: string;
  date: Date;
  category: string;
  supplier: string;
  description: string | null;
  amountCents: number;
  status: string;
  invoiceNo: string | null;
};

export type Finances = {
  tickets: { netCents: number; orders: number };
  sponsors: {
    rows: SponsorRow[];
    agreedCents: number;
    invoicedCents: number;
    paidCents: number;
    /** All three stages together: the money that is promised. */
    totalCents: number;
  };
  expenses: {
    rows: ExpenseRow[];
    byCategory: { id: string; label: string; plannedCents: number; committedCents: number; budgetCents: number | null }[];
    /** planned + invoiced + paid, i.e. everything not cancelled. */
    plannedCents: number;
    /** invoiced + paid, i.e. money we can no longer avoid. */
    committedCents: number;
    paidCents: number;
    budgetCents: number;
  };
  result: {
    /** Cash view: paid in minus paid out. */
    actualCents: number;
    /** If every deal pays and every planned cost is spent. */
    forecastCents: number;
  };
};

export async function getFinances(): Promise<Finances> {
  const db = getDb();
  const [ticketRow, sponsorRows, expenseRows, budgetRows] = await Promise.all([
    db
      .select({
        net: sql<number>`coalesce(sum(${orders.subtotalCents}), 0)::int`,
        n: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(eq(orders.status, "paid")),
    db
      .select({
        id: deckLinks.id,
        label: deckLinks.label,
        tier: deckLinks.tier,
        amountCents: deckLinks.amountCents,
        money: deckLinks.money,
        owner: deckLinks.owner,
      })
      .from(deckLinks)
      // A deal is a confirmed partner with a number on it. Declined rows and
      // links made for a post or the team never carry an amount.
      .where(sql`${deckLinks.stage} = 'confirmed' and ${deckLinks.amountCents} is not null`)
      .orderBy(desc(deckLinks.amountCents)),
    db.select().from(expenses).orderBy(desc(expenses.date)),
    db.select().from(budgets),
  ]);

  const sponsors = sponsorRows.map((r) => ({ ...r, amountCents: r.amountCents ?? 0 }));
  const sumWhere = (m: string) => sponsors.filter((r) => r.money === m).reduce((a, r) => a + r.amountCents, 0);
  const sAgreed = sumWhere("agreed") + sponsors.filter((r) => !r.money).reduce((a, r) => a + r.amountCents, 0);
  const sInvoiced = sumWhere("invoiced");
  const sPaid = sumWhere("paid");

  const budget = new Map(budgetRows.map((b) => [b.category, b.amountCents]));
  const live = expenseRows.filter((e) => e.status !== "cancelled");
  const byCategory = CATEGORIES.map((c) => {
    const rows = live.filter((e) => e.category === c.id);
    return {
      id: c.id,
      label: c.label,
      plannedCents: rows.reduce((a, e) => a + e.amountCents, 0),
      committedCents: rows.filter((e) => e.status !== "planned").reduce((a, e) => a + e.amountCents, 0),
      budgetCents: budget.get(c.id) ?? null,
    };
  });
  const ePlanned = live.reduce((a, e) => a + e.amountCents, 0);
  const eCommitted = live.filter((e) => e.status !== "planned").reduce((a, e) => a + e.amountCents, 0);
  const ePaid = live.filter((e) => e.status === "paid").reduce((a, e) => a + e.amountCents, 0);

  const ticketsNet = ticketRow[0]?.net ?? 0;
  return {
    tickets: { netCents: ticketsNet, orders: ticketRow[0]?.n ?? 0 },
    sponsors: {
      rows: sponsors,
      agreedCents: sAgreed,
      invoicedCents: sInvoiced,
      paidCents: sPaid,
      totalCents: sAgreed + sInvoiced + sPaid,
    },
    expenses: {
      rows: expenseRows,
      byCategory,
      plannedCents: ePlanned,
      committedCents: eCommitted,
      paidCents: ePaid,
      budgetCents: budgetRows.reduce((a, b) => a + b.amountCents, 0),
    },
    result: {
      actualCents: ticketsNet + sPaid - ePaid,
      forecastCents: ticketsNet + sAgreed + sInvoiced + sPaid - ePlanned,
    },
  };
}

export async function addExpense(input: {
  date: Date;
  category: CategoryId;
  supplier: string;
  description: string | null;
  amountCents: number;
  status: ExpenseStatus;
  invoiceNo: string | null;
}): Promise<void> {
  await getDb().insert(expenses).values(input);
}

export async function setExpenseStatus(id: string, status: ExpenseStatus): Promise<void> {
  await getDb().update(expenses).set({ status, updatedAt: new Date() }).where(eq(expenses.id, id));
}

/** Clearing the field removes the budget - the category then reads "няма бюджет". */
export async function removeBudget(category: CategoryId): Promise<void> {
  await getDb().delete(budgets).where(eq(budgets.category, category));
}

export async function setBudget(category: CategoryId, amountCents: number): Promise<void> {
  await getDb()
    .insert(budgets)
    .values({ category, amountCents, updatedAt: new Date() })
    .onConflictDoUpdate({ target: budgets.category, set: { amountCents, updatedAt: new Date() } });
}

/** One flat table the accountant can open - every line, in and out, net. */
export function financesCsv(f: Finances): string {
  const eur = (c: number) => (c / 100).toFixed(2);
  const q = (v: string | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = ["тип;дата;категория;контрагент;описание;пакет;статус;сума без ДДС (EUR)"];
  lines.push(["приход", "", "билети", "", `${f.tickets.orders} платени поръчки`, "", "платено", eur(f.tickets.netCents)].map(q).join(";"));
  for (const s of f.sponsors.rows) {
    lines.push(["приход", "", "спонсор", s.label, "", TIERS.find((t) => t.id === s.tier)?.label ?? s.tier ?? "", MONEY.find((m) => m.id === s.money)?.label ?? "договорено", eur(s.amountCents)].map(q).join(";"));
  }
  for (const e of f.expenses.rows) {
    lines.push(["разход", e.date.toISOString().slice(0, 10), categoryLabel(e.category), e.supplier, e.description ?? "", e.invoiceNo ?? "", EXPENSE_STATUS.find((s) => s.id === e.status)?.label ?? e.status, eur(e.amountCents)].map(q).join(";"));
  }
  // Excel on a Bulgarian machine expects the semicolon and a BOM to read UTF-8.
  return "﻿" + lines.join("\r\n");
}
