import type { Metadata } from "next";
import { redirect } from "next/navigation";
import QRCode from "qrcode";

import { isAdmin, isTotpConfigured, totpEnrolmentUri } from "@/lib/admin-auth";
import { HomeLink } from "@/components/admin/HomeLink";

export const metadata: Metadata = {
  title: "Достъп | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Enrolling a colleague's phone in the second factor.
 *
 * The admin account is one shared login, so the TOTP secret is shared too:
 * every colleague scans this same code once and then has their own rolling
 * codes on their own phone. Nobody waits for anybody else's authenticator,
 * and the second factor stays on - which is the point, since the pages behind
 * it hold buyers' names, emails and invoices.
 *
 * The page is behind the login it enrols for, so scanning it requires already
 * being in. That is not a loophole: someone already logged in has everything
 * this code would give them.
 */
export default async function AccessPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const uri = totpEnrolmentUri();
  const qr = uri
    ? await QRCode.toString(uri, {
        type: "svg",
        margin: 0,
        errorCorrectionLevel: "M",
        color: { dark: "#02251f", light: "#0000" },
      })
    : null;
  const key = process.env.ADMIN_TOTP_SECRET ?? "";

  return (
    <div className="min-h-screen rounded-[1.75rem] bg-bh-paper px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Админ</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-bh-ink">
              Достъп за колега
            </h1>
          </div>
          <HomeLink />
        </div>

        {!isTotpConfigured() ? (
          <p className="mt-8 rounded-2xl bg-bh-cloud px-6 py-8 text-sm leading-relaxed text-bh-ink/70 ring-1 ring-bh-ink/8">
            В момента входът е само с парола, без код от приложение. Няма какво
            да се сканира.
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm leading-relaxed text-bh-ink/60">
              Всеки от екипа сканира този код веднъж със своето приложение
              (Google Authenticator, 1Password, Authy) и след това си генерира
              собствени кодове. Не е нужно да чакате нечий чужд телефон и не се
              налага да сваляме втората стъпка.
            </p>

            <div className="mt-8 flex flex-col items-center gap-6 rounded-2xl bg-bh-cloud p-8 ring-1 ring-bh-ink/8 sm:flex-row sm:items-start">
              <div
                className="h-52 w-52 shrink-0 [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: qr ?? "" }}
              />
              <div className="min-w-0">
                <h2 className="text-sm font-bold tracking-tight text-bh-ink">Ако камерата не тръгне</h2>
                <p className="mt-2 text-sm leading-relaxed text-bh-ink/65">
                  В приложението избери „въвеждане на ключ ръчно“ и напиши този
                  ключ. Сметката се казва Sofia Life Summit.
                </p>
                <code className="mt-3 block break-all rounded-xl bg-bh-paper px-4 py-3 font-mono text-sm tracking-wider text-bh-ink ring-1 ring-bh-ink/10">
                  {key}
                </code>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-bh-ink/15 px-6 py-5">
              <h2 className="text-sm font-bold tracking-tight text-bh-ink">Няколко правила</h2>
              <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-bh-ink/70">
                <li>
                  Кодът се показва само на влязъл в панела. Прати го на колега
                  през мениджър на пароли или на живо, не в чат.
                </li>
                <li>
                  Паролата е обща. Ако някой напусне екипа, се сменя паролата -
                  това затваря достъпа на всички наведнъж и после я раздаваш
                  отново.
                </li>
                <li>
                  Тук се виждат имена, имейли и фактури на купувачи. Достъпът е
                  за екипа, не за партньорски фирми.
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
