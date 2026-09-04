import "server-only";

import { sql } from "drizzle-orm";

import { getAbandonedOrders } from "@/lib/abandoned";
import { getDashboardData } from "@/lib/admin-stats";
import { getDb } from "@/lib/db";
import { orderItems, orders, signups, siteViews } from "@/lib/db/schema";
import { getPreparation } from "@/lib/preparation";
import { STAGE_LABEL, getPricing } from "@/lib/pricing";
import { formatPrice } from "@/lib/tickets";

/**
 * The morning email: what happened yesterday and whether the room is filling
 * fast enough. Written so it can be read on a phone in the queue for coffee -
 * the verdict in the subject, the figures in five lines, the names only
 * where there is something to do about them.
 *
 * "Yesterday" is a Sofia calendar day, not a UTC one: the team lives there.
 */

const TZ = "Europe/Sofia";
const yesterday = sql`(${sql.raw(`now() at time zone '${TZ}'`)})::date - 1`;
const localDay = (col: unknown) => sql`(${col} at time zone ${TZ})::date`;

export type Digest = { subject: string; text: string; html: string };

export async function buildDigest(): Promise<Digest> {
  const db = getDb();
  const [d, pricing, abandoned, prep, [sales], [visits], [signup]] = await Promise.all([
    getDashboardData(),
    getPricing(),
    getAbandonedOrders(50),
    getPreparation(),
    db
      .select({
        orders: sql<number>`count(distinct ${orders.id})::int`,
        tickets: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::int`,
        gross: sql<number>`coalesce(sum(${orderItems.quantity} * ${orderItems.unitPriceCents}), 0)::int`,
      })
      .from(orders)
      .innerJoin(orderItems, sql`${orderItems.orderId} = ${orders.id}`)
      .where(sql`${orders.status} = 'paid' and not ${orders.isTest} and ${localDay(orders.paidAt)} = ${yesterday}`),
    db
      .select({
        visitors: sql<number>`count(distinct ${siteViews.visitor})::int`,
        ticketPage: sql<number>`count(distinct ${siteViews.visitor}) filter (where ${siteViews.path} = '/bilet')::int`,
      })
      .from(siteViews)
      .where(sql`${localDay(siteViews.createdAt)} = ${yesterday}`),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(signups)
      .where(sql`${localDay(signups.createdAt)} = ${yesterday}`),
  ]);

  const seatsLeft = Math.max(0, d.capacityTotal - d.ticketsSold);
  const neededPerDay = seatsLeft / d.daysToEvent;
  const pacePerDay = d.soldLast7Days / 7;
  const onPace = seatsLeft === 0 || pacePerDay >= neededPerDay;
  const fmt1 = (n: number) => n.toLocaleString("bg-BG", { maximumFractionDigits: 1 });
  const abandonedYesterday = abandoned.filter(
    (o) => o.createdAt.getTime() > Date.now() - 48 * 3_600_000,
  );
  const toRemind = abandoned.filter((o) => o.canRemind);

  const dateLabel = new Date(Date.now() - 86_400_000).toLocaleDateString("bg-BG", {
    day: "numeric",
    month: "long",
    timeZone: TZ,
  });

  const subject = `${sales.tickets} билета вчера · ${d.ticketsSold} от ${d.capacityTotal} · ${
    onPace ? "в темпо" : "под темпото"
  } · ${d.daysToEvent} дни`;

  const lines: [string, string][] = [
    ["Вчера", `${sales.tickets} билета в ${sales.orders} поръчки · ${formatPrice(sales.gross)} €`],
    ["Общо", `${d.ticketsSold} от ${d.capacityTotal} места · ${formatPrice(d.grossCents)} € с ДДС`],
    [
      "Темпо",
      seatsLeft === 0
        ? "залата е пълна"
        : `нужни ${fmt1(neededPerDay)} на ден, продаваме ${fmt1(pacePerDay)} · ${d.daysToEvent} дни до събитието`,
    ],
    ["Сайт", `${visits.visitors === 1 ? "1 човек" : `${visits.visitors} души`} вчера · ${visits.ticketPage} отворили билетите · ${signup.n} нови в списъка`],
    [
      "Цени",
      `${STAGE_LABEL[pricing.stage].toLowerCase()}${pricing.discounted ? ` (${pricing.label})` : ""}`,
    ],
    [
      "Недовършени",
      abandoned.length === 0
        ? "няма"
        : `${abandonedYesterday.length} нови вчера · ${toRemind.length} чакат напомняне`,
    ],
    [
      "Партньори",
      prep.total === 0
        ? "още нищо не е уговорено"
        : `получени ${prep.received} от ${prep.total}${
            prep.overdue
              ? ` · просрочени ${prep.overdue}: ${prep.partners
                  .flatMap((p) => p.items.filter((i) => i.overdue).map((i) => `${p.label} - ${i.label.toLowerCase()}`))
                  .slice(0, 4)
                  .join(", ")}`
              : " · нищо просрочено"
          }`,
    ],
  ];

  const remindList = toRemind.slice(0, 5);
  const text = [
    `Sofia Life Summit · ${dateLabel}`,
    "",
    ...lines.map(([k, v]) => `${k}: ${v}`),
    ...(remindList.length
      ? [
          "",
          "За напомняне (бутонът е в таблото):",
          ...remindList.map((o) => `- ${o.name} · ${o.items} · ${o.email}`),
        ]
      : []),
    "",
    "Табло: https://thelongevitysummit.eu/admin",
  ].join("\n");

  const f = "-apple-system,Segoe UI,Roboto,sans-serif";
  const html = `<!doctype html>
<html lang="bg"><body style="margin:0;padding:24px;background:#f2f2ee">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="max-width:560px;margin:0 auto;background:#f8f8f5;border-radius:18px;padding:32px">
    <tr><td>
      <div style="font:400 12px/1 ${f};letter-spacing:2px;text-transform:uppercase;color:#14645599">
        Sofia Life Summit · ${dateLabel}
      </div>
      <h1 style="margin:14px 0 0;font:800 24px/1.2 ${f};color:#02251f">
        ${sales.tickets} билета вчера · ${onPace ? "в темпо" : "под темпото"}
      </h1>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px">
        ${lines
          .map(
            ([k, v]) => `<tr>
          <td style="padding:10px 12px 10px 0;border-top:1px solid #dfe4e0;font:600 13px/1.4 ${f};color:#02251f;white-space:nowrap;vertical-align:top">${k}</td>
          <td style="padding:10px 0;border-top:1px solid #dfe4e0;font:400 14px/1.5 ${f};color:#02251fb3">${v}</td>
        </tr>`,
          )
          .join("")}
      </table>
      ${
        remindList.length
          ? `<p style="margin:22px 0 6px;font:600 13px/1.4 ${f};color:#02251f">За напомняне (бутонът е в таблото)</p>
      ${remindList
        .map(
          (o) =>
            `<div style="font:400 13px/1.6 ${f};color:#02251fb3">${esc(o.name)} · ${esc(o.items)} · ${esc(o.email)}</div>`,
        )
        .join("")}`
          : ""
      }
      <p style="margin:26px 0 0">
        <a href="https://thelongevitysummit.eu/admin"
           style="display:inline-block;background:#146455;color:#f1f5f3;text-decoration:none;font:600 13px/1 ${f};padding:12px 20px;border-radius:999px">
          Отвори таблото
        </a>
      </p>
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}

/** Buyer names and emails land in HTML we mail to ourselves; still escaped. */
function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
