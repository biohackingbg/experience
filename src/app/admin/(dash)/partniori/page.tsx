import type { Metadata } from "next";
import Link from "next/link";

import { HomeLink } from "@/components/admin/HomeLink";
import { requireAccess } from "@/lib/access";
import { deckLinksWithoutProfile, listPartners } from "@/lib/partner-profiles";

import { NewPartnerForm, PartnerEditor } from "./Forms";

export const metadata: Metadata = {
  title: "Профили на партньори | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** What the app shows about each partner: name, logo, a few lines, the stand. */
export default async function PartnersAdminPage() {
  await requireAccess("partniori");
  const [list, deck] = await Promise.all([listPartners(), deckLinksWithoutProfile()]);
  const listed = list.filter((p) => p.listed).length;
  const noLogo = list.filter((p) => p.listed && !p.hasLogo).length;

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 font-display text-3xl font-[900] uppercase tracking-tight text-bh-ink">Профили на партньори</h1>
            {list.length > 0 && (
              <p className="mt-2 text-sm text-bh-ink/60">
                {list.length} профила · {listed} в приложението
                {noLogo > 0 && <span className="text-[#9c3d5c]"> · {noLogo} без лого</span>}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NewPartnerForm deck={deck} />
            <HomeLink />
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-bh-ink/60">
          Това вижда публиката в приложението: име, лого, категория и няколко реда за партньора. Профилът
          се появява едва когато е отметнато „показва се в приложението“. Ако е свързан с партньор от{" "}
          <Link href="/admin/prezentaciya" className="underline">презентацията</Link>, логото му стои на
          щанда в{" "}
          <Link href="/admin/shtandove" className="underline">плана на залата</Link>. Суми, контакти и бележки
          от сделката никога не излизат навън. Офертите на партньора се добавят от{" "}
          <Link href="/admin/oferti" className="underline">Оферти</Link>.
        </p>

        {list.length === 0 ? (
          <p className="mt-8 rounded-3xl bg-bh-cloud px-6 py-8 text-center text-sm text-bh-ink/55 ring-1 ring-bh-ink/6">
            Още няма профили. Натисни „+ Нов профил“ и избери партньор от презентацията.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {list.map((p) => (
              <li key={p.id} className={`rounded-2xl bg-bh-cloud p-5 ring-1 ring-bh-ink/6 ${p.listed ? "" : "opacity-75"}`}>
                <div className="flex flex-wrap items-start gap-4">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-bh-ink/10">
                    {p.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logoUrl} alt="" className="h-full w-full object-contain p-1.5" />
                    ) : (
                      <span className="font-display text-xl font-[900] text-bh-pine">{p.name.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-bh-ink">{p.name}</span>
                      {p.listed ? (
                        <span className="rounded-full bg-bh-pine/12 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-bh-pine">в приложението</span>
                      ) : (
                        <span className="rounded-full bg-bh-ink/8 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-bh-ink/60">скрит</span>
                      )}
                      {p.category && <span className="text-xs text-bh-ink/55">{p.category}</span>}
                    </div>
                    {p.tagline && <div className="text-sm text-bh-ink/75">{p.tagline}</div>}
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-bh-ink/55">
                      <span>{p.deckLabel ? `презентация: ${p.deckLabel}` : "без връзка с презентацията"}</span>
                      <span>{p.booths.length > 0 ? `щанд ${p.booths.join(", ")}` : "без щанд"}</span>
                      <span>{p.offerCount === 1 ? "1 оферта" : `${p.offerCount} оферти`}</span>
                      {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="underline">сайт</a>}
                      {p.instagram && <a href={p.instagram} target="_blank" rel="noreferrer" className="underline">Instagram</a>}
                    </div>
                    <div className="mt-3">
                      <PartnerEditor p={p} deck={deck} />
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
