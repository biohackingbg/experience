import type { Metadata } from "next";

import { HomeLink } from "@/components/admin/HomeLink";
import { BANNERS } from "@/lib/banner-presets";

import { BannerDownload } from "./BannerDownload";
import { requireAccess } from "@/lib/access";
import { getMarketing } from "@/lib/marketing";
import { formatPrice } from "@/lib/tickets";

import { CampaignForm, CampaignItem } from "./Forms";

export const metadata: Metadata = {
  title: "Реклама | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function Tile({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
      <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bh-ink/50">{label}</div>
      <div className="mt-3 text-3xl font-black tracking-tight text-bh-ink">{value}</div>
      {sub && <div className="mt-1 text-xs text-bh-ink/55">{sub}</div>}
    </div>
  );
}

/**
 * The marketing log and what it brought. Certain numbers (tagged links) and
 * indicative ones (what the site saw around a post) are labelled apart.
 */
export default async function MarketingPage() {
  await requireAccess("reklama");
  const m = await getMarketing();
  const untracked = Math.max(0, m.tickets30 - m.taggedTickets);

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">Реклама</h1>
          </div>
          <HomeLink />
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-bh-ink/60">
          Всяка публикация и реклама на един ред: кога, къде, колко е платено и
          какво показва платформата. Сайтът добавя своето: колко души са дошли по
          линка на публикацията и колко от тях са купили. За да се брои това, в
          публикацията се слага <strong className="font-semibold text-bh-ink">линкът с код</strong>,
          който всеки ред дава с бутона „Копирай линка“. Без код остава само
          приблизителното: кой е дошъл от тази платформа в 48-те часа след поста.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile label="Платено за реклама" value={<>{formatPrice(m.spendCents)} €</>} sub="общо, по редовете долу" />
          <Tile
            label="Купили по линк с код"
            value={m.taggedTickets}
            sub={m.taggedTickets ? `билета · ${formatPrice(m.taggedGrossCents)} €` : "още никой не е дошъл по маркиран линк"}
          />
          <Tile
            label="Цена на билет от реклама"
            value={m.costPerTicketCents === null ? "-" : <>{formatPrice(m.costPerTicketCents)} €</>}
            sub="платено ÷ купили по линк с код"
          />
          <Tile
            label="От социални мрежи · 30 дни"
            value={m.socialVisitors30}
            sub={`души на сайта · ${untracked} билета без известен източник`}
          />
        </div>

        {m.platforms.length > 0 && (
          <section className="mt-6 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
            <h2 className="text-lg font-bold tracking-tight text-bh-ink">По платформи</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-bh-ink/10 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/50">
                    <th className="px-3 py-2 font-medium">Платформа</th>
                    <th className="px-3 py-2 font-medium">Публикации</th>
                    <th className="px-3 py-2 font-medium">Платено</th>
                    <th className="px-3 py-2 font-medium">Души · 30 дни</th>
                    <th className="px-3 py-2 font-medium">Купили по линк</th>
                    <th className="px-3 py-2 font-medium">Цена на билет</th>
                  </tr>
                </thead>
                <tbody>
                  {m.platforms.map((p) => (
                    <tr key={p.platform} className="border-b border-bh-ink/6 last:border-0">
                      <td className="px-3 py-2 font-medium text-bh-ink">{p.label}</td>
                      <td className="px-3 py-2 text-bh-ink/75">{p.items}</td>
                      <td className="px-3 py-2 text-bh-ink/75">{p.spendCents ? `${formatPrice(p.spendCents)} €` : "-"}</td>
                      <td className="px-3 py-2 text-bh-ink/75">{p.visitors30}</td>
                      <td className="px-3 py-2 font-semibold text-[#0b6d61]">
                        {p.taggedTickets}{p.taggedTickets ? <span className="ml-1 text-xs font-normal text-bh-ink/55">· {formatPrice(p.taggedGrossCents)} €</span> : null}
                      </td>
                      <td className="px-3 py-2 text-bh-ink/75">
                        {p.spendCents && p.taggedTickets ? `${formatPrice(Math.round(p.spendCents / p.taggedTickets))} €` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Нова публикация или реклама</h2>
          <p className="mt-1 text-xs text-bh-ink/55">
            Показателите от платформата (достигнати, харесвания…) може да се допишат и по-късно с „Редактирай“.
          </p>
          <div className="mt-4"><CampaignForm /></div>
        </section>

        {/* Each network crops a cover to its own frame, so a banner drawn for
            one arrives at the next with its logos cut off. These are drawn per
            frame and carry the dates and the address from the site itself. */}
        <section className="mt-6 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Банери за социалните мрежи</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-bh-ink/55">
            Всеки размер е нарисуван за рамката на своята мрежа, за да не се реже. Датите, мястото и
            адресът идват от сайта - смениш ли ги там, банерите се сменят сами. Ако мрежата откаже PNG - LinkedIn понякога го прави - вземи JPEG от втория бутон.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BANNERS.map((b) => (
              <li key={b.id} className="flex flex-col rounded-2xl bg-bh-paper p-4 ring-1 ring-bh-ink/8">
                <a href={`/api/banner/${b.id}`} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/banner/${b.id}`}
                    alt=""
                    className="w-full rounded-xl bg-[#02251f] object-contain"
                    style={{ aspectRatio: `${b.width} / ${b.height}`, maxHeight: 150 }}
                  />
                </a>
                <div className="mt-3 text-sm font-semibold text-bh-ink">{b.label}</div>
                <div className="mt-0.5 text-xs text-bh-ink/55">{b.note}</div>
                <BannerDownload id={b.id} width={b.width} height={b.height} />
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Дневник</h2>
          {m.campaigns.length === 0 ? (
            <p className="mt-4 rounded-3xl bg-bh-cloud px-6 py-8 text-center text-sm text-bh-ink/55 ring-1 ring-bh-ink/6">
              Още няма записи. Добави първата публикация по-горе и сложи линка ѝ с код в поста.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {m.campaigns.map((c) => <CampaignItem key={c.id} c={c} />)}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
