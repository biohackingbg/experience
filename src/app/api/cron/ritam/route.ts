import { NextResponse } from "next/server";

import { currentChallenge, dayNumber, participantEmails, phaseOf, sofiaHour, sofiaWeekday } from "@/lib/challenge";
import { pushToEmails } from "@/lib/push";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * The challenge's pushes, run twice a day by Vercel Cron (07:30 and 20:30
 * Sofia). The hour decides which message goes out; `?dry=1` shows what
 * would be sent without sending it. The morning note skips anyone who has
 * already checked in; the evening one goes only to those who have not.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  const dry = !!url.searchParams.get("dry");
  const c = await currentChallenge();
  if (!c || !c.active) return NextResponse.json({ ok: true, skipped: "no active challenge" });

  const hour = Number(url.searchParams.get("hour") ?? sofiaHour());
  const day = Number(url.searchParams.get("day") ?? dayNumber(c.startsOn));
  const evening = hour >= 15;
  const data = { screen: "ritam" };

  let to: string[] = [];
  let msg: { title: string; body: string; collapseId: string } | null = null;

  if (day < 1) {
    // The three days before: everyone who joined early gets one heads-up.
    if (!evening && day === -2) {
      to = await participantEmails(c);
      msg = { title: "30 дни ритъм започва във вторник", body: "Избери си час за ставане в приложението, ако още не си. Ден 1 е 10 ноември.", collapseId: "ritam-pre" };
    }
  } else if (day > c.days) {
    if (!evening && day === c.days + 15) {
      to = await participantEmails(c);
      msg = { title: "Време е за повторното измерване", body: "Партньорите ни чакат с InBody. Виж офертите за завършилите в приложението.", collapseId: "ritam-after" };
    }
  } else if (!evening) {
    to = await participantEmails(c, { missingDay: day });
    const phase = phaseOf(day);
    if (day === 1) msg = { title: "Ден 1 · 30 дни ритъм", body: "Днес е простото: стани в прозореца си и излез на светло за 10 минути. Отбележи го с един тап.", collapseId: `ritam-d${day}` };
    else if (day === 8) msg = { title: "Седмица 2 · Светлина и движение", body: "От днес добавяме 10-минутна сутрешна разходка. Крачките се броят сами, ако си свързал Apple Health.", collapseId: `ritam-d${day}` };
    else if (day === 14) msg = { title: "Половината път", body: "14 дни ритъм. Виж как върви групата ти и офертата за средата на пътя.", collapseId: `ritam-d${day}` };
    else if (day === 15) msg = { title: "Седмица 3 · Прозорец за лягане", body: "Сутринта е закотвена. От днес отбелязвай и лягането в прозореца си.", collapseId: `ritam-d${day}` };
    else if (day === 22) msg = { title: "Седмица 4 · И в уикенда", body: "Последната седмица: същият ритъм и в събота и неделя. Това е, което остава.", collapseId: `ritam-d${day}` };
    else if (day === 27) msg = { title: "Три дни до края", body: "Запази си повторно InBody измерване при партньор. Офертата е в приложението.", collapseId: `ritam-d${day}` };
    else if (day === c.days) msg = { title: "Ден 30", body: "Последният тап. После виж своя резултат и кода за следващото издание.", collapseId: `ritam-d${day}` };
    else msg = { title: `Ден ${day} · ${phase.title}`, body: "Станà ли в прозореца си? Един тап и готово.", collapseId: `ritam-d${day}` };
  } else if (sofiaWeekday() === 7) {
    to = await participantEmails(c);
    msg = { title: "Седмицата в ритъм", body: "Виж колко дни от седмицата хвана и как е групата ти. Утре започва нова.", collapseId: `ritam-w${Math.ceil(day / 7)}` };
  } else {
    to = await participantEmails(c, { missingDay: day });
    msg = { title: "Днес още не е отбелязан", body: "Ако сутринта мина по план, отбележи я. Ако не, утре е нов ден.", collapseId: `ritam-d${day}` };
  }

  if (!msg || to.length === 0) return NextResponse.json({ ok: true, day, hour, sent: 0, to: to.length, msg });
  if (dry) return NextResponse.json({ ok: true, dry: true, day, hour, to: to.length, msg });
  const r = await pushToEmails(to, { ...msg, data });
  return NextResponse.json({ ok: true, day, hour, ...r, msg: msg.title });
}
