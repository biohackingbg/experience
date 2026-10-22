import type { TrafficReport } from "@/lib/traffic";

export type Insight = { tone: "good" | "warn" | "info"; text: string };

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : null);

/**
 * The few sentences worth reading before the tables: what changed, where
 * people are lost, which channel and which device do better. Each rule only
 * speaks when it has enough people behind it to mean something - a "gap" of
 * 40% between two groups of five is noise, and saying so would send the team
 * after a ghost.
 */
export function insightsOf(r: TrafficReport): Insight[] {
  const out: Insight[] = [];
  const { cur, prev, live } = r;

  // Today against yesterday at the same hour.
  if (live.yesterdaySameTime >= 30) {
    const d = pct(live.todayVisitors - live.yesterdaySameTime, live.yesterdaySameTime) ?? 0;
    if (d <= -30) out.push({ tone: "warn", text: `Днес до момента са дошли ${live.todayVisitors} души срещу ${live.yesterdaySameTime} вчера по същото време (${d}%). Ако е ден без пост и без реклама, е нормално; иначе провери рекламите.` });
    else if (d >= 30) out.push({ tone: "good", text: `Днес до момента са дошли ${live.todayVisitors} души срещу ${live.yesterdaySameTime} вчера по същото време (+${d}%).` });
  }

  // Conversion, this period against the one before it.
  if (prev && cur.visitors >= 150 && prev.visitors >= 150) {
    const c = (cur.sales / cur.visitors) * 100;
    const p = (prev.sales / prev.visitors) * 100;
    if (Math.abs(c - p) >= 0.4)
      out.push({
        tone: c > p ? "good" : "warn",
        text: `Купуват ${c.toFixed(1)}% от посетителите срещу ${p.toFixed(1)}% в предишния период. ${c > p ? "Сайтът продава по-добре." : "При същия трафик се губят продажби - виж къде в пътя до билет."}`,
      });
  }

  // The step where most people are lost between the ticket page and Stripe.
  if (cur.ticketVisitors >= 100) {
    const toPay = pct(cur.started, cur.ticketVisitors);
    if (toPay !== null && toPay < 10)
      out.push({ tone: "warn", text: `От всеки 100 души, стигнали до страницата с билетите, само ${toPay} натискат „Купи“. Там е най-голямата загуба - цената, формата или доверието.` });
  }

  // Phone against computer.
  const mob = r.devices.find((d) => d.device === "mobile");
  const desk = r.devices.find((d) => d.device === "desktop");
  if (mob && desk && mob.visitors >= 100 && desk.visitors >= 100) {
    const m = pct(mob.ticketVisitors, mob.visitors) ?? 0;
    const d = pct(desk.ticketVisitors, desk.visitors) ?? 0;
    if (Math.abs(m - d) >= 8)
      out.push({ tone: "info", text: `До билетите стигат ${m}% от хората на телефон и ${d}% на компютър. ${m < d ? "Телефонът е с " + (mob.visitors > desk.visitors ? "повечето посетители, така че там е най-големият потенциал." : "по-малко посетители, но отпада повече.") : "Компютърът губи повече хора по пътя."}` });
  }

  // Best and weakest channel, by how many reach the ticket page.
  const real = r.channels.filter((c) => c.visitors >= 50 && c.channel !== "Директно / съобщения");
  if (real.length >= 2) {
    const sorted = [...real].sort((a, b) => b.ticketVisitors / b.visitors - a.ticketVisitors / a.visitors);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const b = pct(best.ticketVisitors, best.visitors) ?? 0;
    const w = pct(worst.ticketVisitors, worst.visitors) ?? 0;
    if (b - w >= 10)
      out.push({ tone: "info", text: `Най-добре стигат до билетите хората от ${best.channel} (${b}%), най-слабо от ${worst.channel} (${w}%).` });
  }

  // Money per campaign.
  const priced = r.campaigns.filter((c) => c.spendCents > 0 && c.tickets > 0).map((c) => ({ c, per: c.spendCents / c.tickets }));
  if (priced.length >= 2) {
    priced.sort((a, b) => a.per - b.per);
    const best = priced[0];
    out.push({ tone: "good", text: `Най-евтин билет носи „${best.c.title ?? best.c.code}“ - ${(best.per / 100).toFixed(0)} € на билет от платена реклама.` });
  }

  // How much of the money cannot be traced to a source.
  const taggedTickets = r.channels.reduce((n, c) => n + c.tickets, 0);
  const allTickets = taggedTickets + r.unknownSales.tickets;
  if (allTickets >= 8) {
    const u = pct(r.unknownSales.tickets, allTickets) ?? 0;
    if (u >= 40) out.push({ tone: "info", text: `${u}% от продадените билети са без известен източник. Слагай линк с код във всяка публикация и реклама, за да се види какво продава.` });
  }

  if (r.human && r.botViews > 0)
    out.push({ tone: "info", text: `Скрити са ${r.botViews} отваряния от центрове за данни (проверки на Meta и Apple, скенери). Не са хора и никога не купуват.` });

  return out;
}
