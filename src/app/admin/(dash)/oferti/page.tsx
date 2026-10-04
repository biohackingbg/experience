import type { Metadata } from "next";
import Link from "next/link";

import { HomeLink } from "@/components/admin/HomeLink";
import { requireAccess } from "@/lib/access";
import { listOffersWithState } from "@/lib/offers";
import { listPartners } from "@/lib/partner-profiles";
import { TIERS } from "@/lib/tickets";

import { NewOfferForm, OfferEditor, type OfferRow } from "./Forms";

export const metadata: Metadata = {
  title: "Оферти | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** YYYY-MM-DD of a moment, as the calendar in Sofia has it. */
const sofiaDate = (d: Date | null) => (d ? d.toLocaleDateString("en-CA", { timeZone: "Europe/Sofia" }) : "");
const bgDate = (d: Date) => d.toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Sofia" });

/** The deal wall in the app: what the partners give to ticket holders. */
export default async function OffersAdminPage() {
  await requireAccess("oferti");
  const [offers, partners] = await Promise.all([listOffersWithState(), listPartners()]);
  const tiers = TIERS.map((t) => ({ id: t.id, name: t.name }));
  const tierName = (id: string) => tiers.find((t) => t.id === id)?.name ?? id;
  const partnerOptions = partners.map((p) => ({ id: p.id, name: p.name, listed: p.listed }));
  const logoOf = new Map(partners.map((p) => [p.id, p.logoUrl]));

  const rows = offers.map((o) => {
    const tierIds = (o.tiers ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const status = !o.active ? "скрита" : o.over ? "изтекла" : o.notYet ? `от ${bgDate(o.validFrom!)}` : "видима";
    const row: OfferRow = {
      id: o.id,
      partner: o.partner,
      partnerId: o.partnerId,
      title: o.title,
      titleEn: o.titleEn,
      body: o.body,
      bodyEn: o.bodyEn,
      how: o.how,
      howEn: o.howEn,
      code: o.code,
      url: o.url,
      tiers: tierIds,
      place: o.place,
      from: sofiaDate(o.validFrom),
      to: sofiaDate(o.validTo),
      active: o.active,
      sort: o.sort,
    };
    return { row, status, live: status === "видима", logo: o.partnerId ? (logoOf.get(o.partnerId) ?? null) : null };
  });
  const live = rows.filter((r) => r.live).length;

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 font-display text-3xl font-[900] uppercase tracking-tight text-bh-ink">Оферти</h1>
            {rows.length > 0 && <p className="mt-2 text-sm text-bh-ink/60">{rows.length} оферти · {live} се виждат сега</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NewOfferForm partners={partnerOptions} tiers={tiers} />
            <HomeLink />
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-bh-ink/60">
          Офертите се виждат в приложението, в раздел „Оферти“, само от хора с билет. Всяка може да е за
          всички билети или само за някои нива, на място или онлайн, и с начална и крайна дата. Промяната
          тук се вижда в приложението веднага, без нова версия. Логото идва от{" "}
          <Link href="/admin/partniori" className="underline">профила на партньора</Link>
          {partners.length === 0 && " - още няма профили, затова първо добави партньора там"}.
        </p>

        {rows.length === 0 ? (
          <p className="mt-8 rounded-3xl bg-bh-cloud px-6 py-8 text-center text-sm text-bh-ink/55 ring-1 ring-bh-ink/6">
            Още няма оферти. Натисни „+ Нова оферта“.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {rows.map(({ row: o, status, live: on, logo }) => (
              <li key={o.id} className={`rounded-2xl bg-bh-cloud p-5 ring-1 ring-bh-ink/6 ${on ? "" : "opacity-70"}`}>
                <div className="flex flex-wrap items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-bh-ink/10">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt="" className="h-full w-full object-contain p-1.5" />
                    ) : (
                      <span className="font-display text-lg font-[900] text-bh-pine">{o.partner.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-bh-ink/60">{o.partner}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide ${on ? "bg-bh-pine/12 text-bh-pine" : "bg-bh-ink/8 text-bh-ink/60"}`}>{status}</span>
                      <span className="rounded-full bg-bh-ink/6 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-bh-ink/60">{o.place === "online" ? "онлайн" : "на място"}</span>
                      <span className="text-xs text-bh-ink/55">{o.tiers.length === 0 ? "всички билети" : o.tiers.map(tierName).join(", ")}</span>
                    </div>
                    <div className="mt-1 font-semibold text-bh-ink">{o.title}</div>
                    {o.body && <div className="text-sm text-bh-ink/70">{o.body}</div>}
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-bh-ink/55">
                      {o.how && <span>{o.how}</span>}
                      {o.code && <span className="font-mono font-semibold text-bh-ink">{o.code}</span>}
                      {o.to && <span>до {o.to.split("-").reverse().join(".")}</span>}
                      {o.url && <a href={o.url} target="_blank" rel="noreferrer" className="underline">линк</a>}
                    </div>
                    <div className="mt-3">
                      <OfferEditor o={o} partners={partnerOptions} tiers={tiers} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
