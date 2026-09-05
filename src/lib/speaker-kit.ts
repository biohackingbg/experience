import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { latin } from "@/lib/latin";
import { PLATFORMS } from "@/lib/marketing-options";

/**
 * A private page per speaker, reached by a signed link rather than a token
 * in a table: fifty links that never expire, nothing to revoke one by one,
 * and no way to guess someone else's. The signature covers the speaker id,
 * so a link is bound to the person it was made for.
 */
function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET is not set");
  return s;
}

const sign = (id: string) => createHmac("sha256", secret()).update(`kit:${id}`).digest("hex").slice(0, 24);

export const kitToken = (speakerId: string) => `${speakerId}.${sign(speakerId)}`;

export function readKitToken(token: string): string | null {
  const i = token.lastIndexOf(".");
  if (i < 1) return null;
  const id = token.slice(0, i);
  const sig = token.slice(i + 1);
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return null;
  const expected = sign(id);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return id;
}

export const kitUrl = (speakerId: string) => `https://thelongevitysummit.eu/za-lektori/${kitToken(speakerId)}`;

/**
 * The links a speaker shares. One per platform, because the admin's marketing
 * page groups by platform and campaign - the campaign carries who brought the
 * visitor, the source carries where from. Both are shapes the admin already
 * understands, so nothing has to be renamed later.
 */
export const SHARE_PLATFORMS = PLATFORMS.filter((p) => ["instagram", "facebook", "linkedin"].includes(p.id));

export function shareLinks(speakerId: string, lang: "bg" | "en" = "bg") {
  const base = lang === "en" ? "https://thelongevitysummit.eu/en" : "https://thelongevitysummit.eu";
  const campaign = `lektor-${speakerId}`.slice(0, 60);
  return SHARE_PLATFORMS.map((p) => ({
    id: p.id,
    label: p.label,
    url: `${base}?utm_source=${p.id}&utm_campaign=${campaign}`,
  }));
}

/** What a speaker is asked to write, with their own name already in it. */
export function suggestedPosts(name: string, topic: string | null, lang: "bg" | "en" = "bg") {
  const who = lang === "en" ? latin(name) : name;
  const subject = topic?.trim();
  if (lang === "en") {
    return [
      {
        title: "The short one",
        text: `On 7-8 November I am speaking at Sofia Life Summit in Sofia - two days of longevity science in plain language, at Grand Hotel Millennium.${subject ? ` My talk: ${subject}.` : ""} Tickets and the full programme are on the site.`,
      },
      {
        title: "The one that says why",
        text: `Most of what I do every day stays inside a clinic. On 7-8 November it comes out of it: Sofia Life Summit brings doctors and researchers on one stage, for people without a medical background - 25 minutes each, no jargon.${subject ? ` I will be talking about ${subject.toLowerCase()}.` : ""} If you have been meaning to take your health seriously, this is a good weekend to start.`,
      },
    ];
  }
  return [
    {
      title: "Кратък",
      text: `На 7 и 8 ноември съм лектор на Sofia Life Summit в Гранд Хотел Милениум, София - два дни наука за дълголетието на разбираем език.${subject ? ` Моята тема: ${subject}.` : ""} Билети и цялата програма са на сайта.`,
    },
    {
      title: "По-личен",
      text: `Голяма част от това, което правя всеки ден, остава в кабинета. На 7 и 8 ноември излиза от него: Sofia Life Summit събира лекари и изследователи на една сцена, за хора без медицинско образование - по 25 минути, без жаргон.${subject ? ` Аз ще говоря за ${subject.toLowerCase()}.` : ""} Ако отдавна си обещаваш да се погрижиш за здравето си, това е добър уикенд за начало.`,
    },
    {
      title: "За стори",
      text: `${who} на Sofia Life Summit · 07-08 ноември · Гранд Хотел Милениум${subject ? ` · ${subject}` : ""}`,
    },
  ];
}
