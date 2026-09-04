import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { HomeLink } from "@/components/admin/HomeLink";
import { listGrants } from "@/lib/access";
import { isAdmin } from "@/lib/admin-auth";

import { GrantRow, NewGrantForm } from "./Forms";

export const metadata: Metadata = {
  title: "Достъп | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Handing out access without handing out the password: one link per
 * person, listing the pages it opens, with an expiry and a stop button.
 * Team-only - a grant holder never sees this page.
 */
export default async function AccessPage() {
  if (!(await isAdmin())) redirect("/admin");
  const grants = await listGrants();
  const live = grants.filter((g) => !g.dead);

  return (
    <div className="px-5 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">Достъп</h1>
          </div>
          <HomeLink />
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-bh-ink/60">
          Екипът влиза с общата парола и вижда всичко. На външен човек - агенция,
          партньор - не се дава паролата, а <strong className="font-semibold text-bh-ink">линк за достъп</strong>:
          отваря само отбелязаните страници, в менюто му няма други, и всяко
          действие се проверява на сървъра. Линкът може да има срок и се спира с
          един бутон. Страниците с лични данни на купувачи са отбелязани; давай ги
          само когато наистина трябва.
        </p>

        <section className="mt-8 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Нов достъп</h2>
          <div className="mt-4"><NewGrantForm /></div>
        </section>

        <section className="mt-6 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/6">
          <h2 className="text-lg font-bold tracking-tight text-bh-ink">Раздадени достъпи</h2>
          <p className="mt-1 text-xs text-bh-ink/55">{live.length} активни от {grants.length}</p>
          {grants.length === 0 ? (
            <p className="mt-4 text-sm text-bh-ink/55">Още няма раздаден достъп.</p>
          ) : (
            <ul className="mt-2 divide-y divide-bh-ink/8">
              {grants.map((g) => <GrantRow key={g.id} g={g} />)}
            </ul>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-bh-ink/15 px-6 py-5">
          <h2 className="text-sm font-bold tracking-tight text-bh-ink">Няколко правила</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-bh-ink/70">
            <li>Линкът е ключът. Прати го през сигурен канал и на един човек; ако бъде препратен, спри го и направи нов.</li>
            <li>Паролата е обща за екипа. Ако някой напусне екипа, тя се сменя - това затваря достъпа на всички наведнъж.</li>
            <li>Таблото, Финанси, Фактури, Записвания и Писма показват имена и имейли на купувачи. Достъп до тях е за екипа, не за партньорски фирми.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
