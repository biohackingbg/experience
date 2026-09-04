import "server-only";

import { sql } from "drizzle-orm";

import { getDashboardData } from "@/lib/admin-stats";
import { getDb } from "@/lib/db";
import { orderItems, orders, siteViews } from "@/lib/db/schema";
import { SOLD } from "@/lib/sold";
import { formatPrice } from "@/lib/tickets";

/**
 * Monday morning: the week that ended, against the week before it, and
 * what the pace means for the room. One table, no chart - a comparison is
 * what a Monday needs, and two numbers side by side are the comparison.
 */

const TZ = "Europe/Sofia";
const weekAgo = (n: number) => sql.raw(`now() - interval '${n * 7} days'`);

export type Weekly = { subject: string; text: string; html: string };

export async function buildWeekly(): Promise<Weekly> {
  const db = getDb();
  const window = (from: number, to: number) =>
    sql`${SOLD} and ${orders.paidAt} >= ${weekAgo(from)} and ${orders.paidAt} < ${weekAgo(to)}`;

  const [d, [thisWeek], [lastWeek], [visits]] = await Promise.all([
    getDashboardData(),
    db
      .select({
        tickets: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
        gross: sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.unitPriceCents}), 0)::int`,
      })
      .from(orders)
      .innerJoin(orderItems, sql`${orderItems.orderId} = ${orders.id}`)
      .where(window(1, 0)),
    db
      .select({
        tickets: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
        gross: sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.unitPriceCents}), 0)::int`,
      })
      .from(orders)
      .innerJoin(orderItems, sql`${orderItems.orderId} = ${orders.id}`)
      .where(window(2, 1)),
    db
      .select({ visitors: sql<number>`count(distinct ${siteViews.visitor})::int` })
      .from(siteViews)
      .where(sql`${siteViews.createdAt} >= ${weekAgo(1)}`),
  ]);

  const seatsLeft = Math.max(0, d.capacityTotal - d.ticketsSold);
  const perWeekNeeded = (seatsLeft / d.daysToEvent) * 7;
  const change = lastWeek.tickets === 0 ? null : Math.round(((thisWeek.tickets - lastWeek.tickets) / lastWeek.tickets) * 100);
  const weeksLeft = Math.max(1, Math.round(d.daysToEvent / 7));
  const fmt1 = (n: number) => n.toLocaleString("bg-BG", { maximumFractionDigits: 1 });
  const dateLabel = new Date().toLocaleDateString("bg-BG", { day: "numeric", month: "long", timeZone: TZ });

  const subject = `Седмицата: ${thisWeek.tickets} билета${change === null ? "" : `, ${change >= 0 ? "+" : ""}${change}% спрямо предната`} · ${weeksLeft} седмици до събитието`;

  const lines: [string, string][] = [
    ["Тази седмица", `${thisWeek.tickets} билета · ${formatPrice(thisWeek.gross)} €`],
    ["Предната", `${lastWeek.tickets} билета · ${formatPrice(lastWeek.gross)} €`],
    ["Общо", `${d.ticketsSold} от ${d.capacityTotal} места · ${formatPrice(d.grossCents)} € с ДДС`],
    ["Нужни на седмица", seatsLeft === 0 ? "залата е пълна" : `${fmt1(perWeekNeeded)}, за да е пълна залата · остават ${weeksLeft} седмици`],
    ["Сайт", `${visits.visitors} души за седмицата`],
  ];

  const f = "-apple-system,Segoe UI,Roboto,sans-serif";
  const text = [`Sofia Life Summit · седмица до ${dateLabel}`, "", ...lines.map(([k, v]) => `${k}: ${v}`), "", "Табло: https://thelongevitysummit.eu/admin"].join("\n");
  const html = `<!doctype html><html lang="bg"><body style="margin:0;padding:24px;background:#f2f2ee">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#f8f8f5;border-radius:18px;padding:32px"><tr><td>
    <div style="font:400 12px/1 ${f};letter-spacing:2px;text-transform:uppercase;color:#14645599">Sofia Life Summit · седмица до ${dateLabel}</div>
    <h1 style="margin:14px 0 0;font:800 24px/1.2 ${f};color:#02251f">${thisWeek.tickets} билета${change === null ? "" : ` · ${change >= 0 ? "+" : ""}${change}% спрямо предната`}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px">
      ${lines.map(([k, v]) => `<tr><td style="padding:10px 12px 10px 0;border-top:1px solid #dfe4e0;font:600 13px/1.4 ${f};color:#02251f;white-space:nowrap;vertical-align:top">${k}</td><td style="padding:10px 0;border-top:1px solid #dfe4e0;font:400 14px/1.5 ${f};color:#02251fb3">${v}</td></tr>`).join("")}
    </table>
    <p style="margin:26px 0 0"><a href="https://thelongevitysummit.eu/admin" style="display:inline-block;background:#146455;color:#f1f5f3;text-decoration:none;font:600 13px/1 ${f};padding:12px 20px;border-radius:999px">Отвори таблото</a></p>
  </td></tr></table></body></html>`;

  return { subject, text, html };
}
