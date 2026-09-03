import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { deckLinks, deliverableStatus } from "@/lib/db/schema";
import { DELIVERABLES, parseDeliverables } from "@/lib/finance-options";

/**
 * October's question: what has each confirmed partner promised, and what
 * has actually arrived. The promise is on the pipeline row (deliverables,
 * tickets); the arrival is one row per promise here, with a due date so
 * "not yet" can become "late" without anyone remembering the date.
 */

/** The ticket allocation is tracked like a deliverable: codes sent or not. */
export const TICKETS_KIND = "tickets";

export function isKind(v: unknown): v is string {
  return v === TICKETS_KIND || DELIVERABLES.some((d) => d.id === v);
}

export function kindLabel(kind: string, ticketsCount: number | null): string {
  if (kind === TICKETS_KIND) return `${ticketsCount ?? 0} билета`;
  return DELIVERABLES.find((d) => d.id === kind)?.label ?? kind;
}

export type PrepItem = {
  kind: string;
  label: string;
  receivedAt: Date | null;
  /** YYYY-MM-DD, or null when no date was agreed. */
  dueDate: string | null;
  note: string | null;
  overdue: boolean;
};

export type PrepPartner = {
  id: string;
  label: string;
  owner: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  items: PrepItem[];
  received: number;
  total: number;
};

export type Preparation = {
  partners: PrepPartner[];
  received: number;
  total: number;
  overdue: number;
  byKind: { kind: string; label: string; received: number; total: number }[];
};

export async function getPreparation(): Promise<Preparation> {
  const db = getDb();
  const [links, statuses] = await Promise.all([
    db
      .select({
        id: deckLinks.id,
        label: deckLinks.label,
        owner: deckLinks.owner,
        contactName: deckLinks.contactName,
        contactEmail: deckLinks.contactEmail,
        contactPhone: deckLinks.contactPhone,
        deliverables: deckLinks.deliverables,
        ticketsCount: deckLinks.ticketsCount,
      })
      .from(deckLinks)
      .where(and(eq(deckLinks.stage, "confirmed"), isNull(deckLinks.revokedAt))),
    db.select().from(deliverableStatus),
  ]);

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(new Date());
  const byKey = new Map(statuses.map((s) => [`${s.linkId}:${s.kind}`, s]));

  const partners: PrepPartner[] = links.map((l) => {
    const kinds: string[] = [
      ...parseDeliverables(l.deliverables),
      ...(l.ticketsCount ? [TICKETS_KIND] : []),
    ];
    const items = kinds.map((kind) => {
      const s = byKey.get(`${l.id}:${kind}`);
      const dueDate = s?.dueDate ?? null;
      const receivedAt = s?.receivedAt ?? null;
      return {
        kind,
        label: kindLabel(kind, l.ticketsCount),
        receivedAt,
        dueDate,
        note: s?.note ?? null,
        overdue: !receivedAt && !!dueDate && dueDate < today,
      };
    });
    return {
      id: l.id,
      label: l.label,
      owner: l.owner,
      contactName: l.contactName,
      contactEmail: l.contactEmail,
      contactPhone: l.contactPhone,
      items,
      received: items.filter((i) => i.receivedAt).length,
      total: items.length,
    };
  });

  // The most outstanding first - the page is a to-do list, not a directory.
  partners.sort(
    (a, b) => b.total - b.received - (a.total - a.received) || a.label.localeCompare(b.label, "bg"),
  );

  const all = partners.flatMap((p) => p.items);
  const byKind = [...DELIVERABLES.map((d) => d.id), TICKETS_KIND]
    .map((kind) => ({
      kind,
      label: kind === TICKETS_KIND ? "Билети" : DELIVERABLES.find((d) => d.id === kind)?.label ?? kind,
      total: all.filter((i) => i.kind === kind).length,
      received: all.filter((i) => i.kind === kind && i.receivedAt).length,
    }))
    .filter((k) => k.total > 0);

  return {
    partners,
    received: all.filter((i) => i.receivedAt).length,
    total: all.length,
    overdue: all.filter((i) => i.overdue).length,
    byKind,
  };
}

export async function setDeliverable(
  linkId: string,
  kind: string,
  patch: { received?: boolean; dueDate?: string | null; note?: string | null },
): Promise<void> {
  const set: Partial<typeof deliverableStatus.$inferInsert> = { updatedAt: new Date() };
  if (patch.received !== undefined) set.receivedAt = patch.received ? new Date() : null;
  if (patch.dueDate !== undefined) set.dueDate = patch.dueDate;
  if (patch.note !== undefined) set.note = patch.note;
  await getDb()
    .insert(deliverableStatus)
    .values({ linkId, kind, ...set })
    .onConflictDoUpdate({ target: [deliverableStatus.linkId, deliverableStatus.kind], set });
}

export async function setContact(
  linkId: string,
  contact: { contactName: string | null; contactEmail: string | null; contactPhone: string | null },
): Promise<void> {
  await getDb().update(deckLinks).set(contact).where(eq(deckLinks.id, linkId));
}
