import "server-only";

import { and, eq, isNull, ne, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { boothAssignments, deckLinks } from "@/lib/db/schema";
import { BOOTHS, type BoardBooth, type BoardPartner, type BoothStatus } from "@/lib/booths-plan";

/**
 * The board: every module with who is on it, and every partner who could
 * be. The status is derived here, once, so the plan, the list and a later
 * public view all say the same thing about the same stand.
 */
export type Board = {
  booths: BoardBooth[];
  partners: BoardPartner[];
  counts: Record<BoothStatus, number>;
};

export async function getBoard(): Promise<Board> {
  const db = getDb();
  const [rows, links] = await Promise.all([
    db.select().from(boothAssignments),
    db
      .select({ id: deckLinks.id, label: deckLinks.label, tier: deckLinks.tier, money: deckLinks.money, stage: deckLinks.stage })
      .from(deckLinks)
      .where(and(ne(deckLinks.stage, "declined"), isNull(deckLinks.revokedAt)))
      .orderBy(sql`lower(${deckLinks.label})`),
  ]);
  const byBooth = new Map(rows.map((r) => [r.booth, r]));
  const linkById = new Map(links.map((l) => [l.id, l]));

  const booths: BoardBooth[] = BOOTHS.map((b) => {
    const row = byBooth.get(b.id);
    const partner = row?.deckLinkId ? (linkById.get(row.deckLinkId) ?? null) : null;
    const status: BoothStatus = partner
      ? partner.money === "paid"
        ? "paid"
        : "reserved"
      : row?.holdLabel
        ? "held"
        : "free";
    return { ...b, status, partner, holdLabel: row?.holdLabel ?? null, note: row?.note ?? null };
  });

  const partners: BoardPartner[] = links.map((l) => ({
    ...l,
    booths: booths.filter((b) => b.partner?.id === l.id).map((b) => b.id),
  }));

  const counts: Record<BoothStatus, number> = { free: 0, held: 0, reserved: 0, paid: 0 };
  for (const b of booths) counts[b.status] += 1;
  return { booths, partners, counts };
}

export type BoothInput = { deckLinkId: string | null; holdLabel: string | null; note: string | null };

/** Writes one module. Nothing on it at all means the row goes, so "free" has one shape. */
export async function setBooth(booth: string, input: BoothInput): Promise<void> {
  const db = getDb();
  if (!input.deckLinkId && !input.holdLabel && !input.note) {
    await db.delete(boothAssignments).where(eq(boothAssignments.booth, booth));
    return;
  }
  await db
    .insert(boothAssignments)
    .values({ booth, ...input, updatedAt: new Date() })
    .onConflictDoUpdate({ target: boothAssignments.booth, set: { ...input, updatedAt: new Date() } });
}
