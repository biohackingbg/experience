import type { Metadata } from "next";

import { AccessRequestForm } from "./AccessRequestForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Вход с имейл | Sofia Life Summit",
  robots: { index: false, follow: false },
};

/**
 * Where someone with page access signs in: their address, and a link that
 * lasts half an hour arrives in their inbox. No password to share, nothing
 * to forward, and taking access away is one revoke in the admin.
 */
export default function AccessRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bh-paper px-5 py-16">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 ring-1 ring-bh-ink/8">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Sofia Life Summit</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-bh-ink">Вход с имейл</h1>
        <p className="mt-3 text-sm leading-relaxed text-bh-ink/65">
          Въведи адреса, на който ти е даден достъп. Изпращаме връзка за вход, която важи месец - след
          влизане оставаш вписан(а) три месеца, без да я търсиш пак.
        </p>
        <AccessRequestForm />
      </div>
    </div>
  );
}
