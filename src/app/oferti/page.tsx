import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { BackLink } from "@/components/BackLink";
import { userFromToken } from "@/lib/app-auth";
import { listTicketsForEmail } from "@/lib/app-tickets";
import { langOf } from "@/lib/i18n";
import { listOffersFor } from "@/lib/offers";
import { listPublicPartners } from "@/lib/partner-profiles";

import { logout } from "./actions";
import { OFFERS_COOKIE } from "./cookie";
import { CopyCode, LoginForm } from "./Form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Оферти от партньорите | Sofia Life Summit 2026",
  robots: { index: false, follow: false },
};

const T = {
  bg: {
    back: "Към сайта",
    title: "Оферти от партньорите",
    intro: "Специалните предложения на партньорите на Sofia Life Summit 2026 са за посетителите на събитието. Влез с имейла, с който е билетът ти: пращаме ти код, без пароли.",
    help: "Билетът е подарен или купен от друг човек? Влез с имейла, на който е регистриран.",
    hello: (e: string) => `Влезе като ${e}`,
    out: "Изход",
    none: "Офертите са за посетителите на Sofia Life Summit 2026",
    noneBody: (e: string) => `Не намираме билет за ${e}. Ако билетът е на друг имейл, излез и влез с него.`,
    other: "Влез с друг имейл",
    empty: "В момента няма активни оферти. Провери пак скоро.",
    code: "Код",
    online: "Онлайн",
    onsite: "На място",
    until: (d: string) => `до ${d}`,
    site: "Сайт",
    app: "Офертите са и в приложението Sofia Life Summit.",
  },
  en: {
    back: "Back to the site",
    title: "Partner offers",
    intro: "The special offers from the partners of Sofia Life Summit 2026 are for the people who came. Sign in with the email your ticket is under: we send you a code, no passwords.",
    help: "Was your ticket a gift, or bought by someone else? Sign in with the email it is registered to.",
    hello: (e: string) => `Signed in as ${e}`,
    out: "Sign out",
    none: "The offers are for Sofia Life Summit 2026 attendees",
    noneBody: (e: string) => `We find no ticket for ${e}. If your ticket is under another email, sign out and sign in with that one.`,
    other: "Use another email",
    empty: "There are no live offers right now. Check again soon.",
    code: "Code",
    online: "Online",
    onsite: "On site",
    until: (d: string) => `until ${d}`,
    site: "Website",
    app: "The offers are in the Sofia Life Summit app too.",
  },
} as const;

/** What the button on an offer says, read from where its link goes. */
function cta(url: string, en: boolean): string {
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(url)) return en ? "Message on WhatsApp" : "Пиши в WhatsApp";
  if (/^tel:/i.test(url)) return en ? "Call" : "Обади се";
  if (/reserv|booking|book|rezerv/i.test(url)) return en ? "Book" : "Резервирай";
  return en ? "Open" : "Към офертата";
}

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/**
 * The partner offers on the website, for people with a ticket: the same deal
 * wall as the app, from the same table and the same tier rules, behind the
 * same six-digit sign-in. The team runs it from Админ → Оферти.
 */
export default async function OffersPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang: raw } = await searchParams;
  const lang = langOf(raw);
  const en = lang === "en";
  const t = T[lang];

  const user = await userFromToken((await cookies()).get(OFFERS_COOKIE)?.value);
  const tickets = user ? await listTicketsForEmail(user.email) : [];
  const tiers = [...new Set(tickets.map((x) => x.tierId))];
  const [offers, partners] = user && tickets.length > 0 ? await Promise.all([listOffersFor(tiers, lang), listPublicPartners(lang)]) : [[], []];
  const profile = new Map(partners.map((p) => [p.id, p]));

  // One block per partner, in the order the team sorted the offers.
  const groups: { key: string; name: string; logo: string | null; partnerId: string | null; items: typeof offers }[] = [];
  for (const o of offers) {
    const key = o.partnerId ?? o.partner.toLowerCase();
    let g = groups.find((x) => x.key === key);
    if (!g) groups.push((g = { key, name: o.partner, logo: o.logo, partnerId: o.partnerId, items: [] }));
    g.items.push(o);
  }
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(en ? "en-GB" : "bg-BG", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Sofia" });

  return (
    <div className="min-h-screen rounded-[1.75rem] bg-bh-paper px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <BackLink>{t.back}</BackLink>
          <Link href={`/oferti?lang=${en ? "bg" : "en"}`} className="rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold text-bh-ink">
            {en ? "Български" : "English"}
          </Link>
        </div>
        <h1 className="mt-8 font-display text-[clamp(2rem,5vw,3.2rem)] font-[900] uppercase leading-[0.95] tracking-tight text-bh-ink">{t.title}</h1>

        {!user && (
          <div className="max-w-md">
            <p className="mt-4 text-sm leading-relaxed text-bh-ink/70">{t.intro}</p>
            <LoginForm lang={lang} />
            <p className="mt-6 text-xs leading-relaxed text-bh-ink/50">{t.help}</p>
          </div>
        )}

        {user && (
          <form action={logout} className="mt-4 flex flex-wrap items-center gap-3 text-sm text-bh-ink/60">
            <span>{t.hello(user.email)}</span>
            <button type="submit" className="font-semibold text-bh-ink underline underline-offset-2">{t.out}</button>
          </form>
        )}

        {user && tickets.length === 0 && (
          <div className="mt-8 max-w-md rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
            <p className="text-lg font-bold text-bh-ink">{t.none}</p>
            <p className="mt-2 text-sm leading-relaxed text-bh-ink/70">{t.noneBody(user.email)}</p>
            <form action={logout}>
              <button type="submit" className="mt-5 rounded-full bg-bh-ink px-5 py-3 text-sm font-semibold text-bh-paper">{t.other}</button>
            </form>
          </div>
        )}

        {user && tickets.length > 0 && groups.length === 0 && <p className="mt-8 text-sm text-bh-ink/70">{t.empty}</p>}

        {groups.length > 0 && (
          <div className="mt-10 space-y-6">
            {groups.map((g) => {
              const p = g.partnerId ? profile.get(g.partnerId) : undefined;
              return (
                <section key={g.key} className="rounded-3xl bg-white p-5 ring-1 ring-bh-ink/8 sm:p-7">
                  <div className="flex items-start gap-4">
                    {g.logo && (
                      // eslint-disable-next-line @next/next/no-img-element -- partner logos are served by our own route, sized by the box
                      <img src={g.logo} alt="" className="h-14 w-14 shrink-0 rounded-2xl bg-bh-cloud object-contain p-1.5" />
                    )}
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-bh-ink">{g.name}</h2>
                      {p?.tagline && <p className="mt-0.5 text-sm text-bh-ink/60">{p.tagline}</p>}
                    </div>
                  </div>
                  {p?.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-bh-ink/75">{p.description}</p>}
                  {p?.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-semibold text-bh-pine underline underline-offset-2">
                      {t.site}: {host(p.website)}
                    </a>
                  )}

                  <div className="mt-5 space-y-3">
                    {g.items.map((o) => (
                      <div key={o.id} className="rounded-2xl bg-bh-cloud p-4 sm:p-5">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-bh-ink/50">
                          <span>{o.place === "online" ? t.online : t.onsite}</span>
                          {o.validTo && <span>{t.until(fmtDate(o.validTo))}</span>}
                        </div>
                        <h3 className="mt-1.5 text-lg font-bold leading-snug text-bh-ink">{o.title}</h3>
                        {o.body && <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-bh-ink/75">{o.body}</p>}
                        {o.how && <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-bh-ink/60">{o.how}</p>}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          {o.code && <CopyCode code={o.code} lang={lang} />}
                          {o.url && (
                            <a href={o.url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-bh-ink px-5 py-2.5 text-sm font-semibold text-bh-paper transition-transform hover:-translate-y-0.5">
                              {cta(o.url, en)}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
            <p className="text-xs text-bh-ink/50">{t.app}</p>
          </div>
        )}
      </div>
    </div>
  );
}
