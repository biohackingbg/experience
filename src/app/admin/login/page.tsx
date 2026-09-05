import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdmin, isTotpConfigured } from "@/lib/admin-auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Вход | Администрация",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ dostap?: string }>;
}) {
  if (await isAdmin()) redirect("/admin");
  const { dostap } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center rounded-[1.75rem] bg-bh-paper px-5">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight text-bh-ink">
          Администрация
        </h1>
        <p className="mt-2 text-sm text-bh-ink/60">
          Sofia Life Summit - продажби и статистика.
        </p>
        {dostap === "invalid" && (
          <p className="mt-4 rounded-2xl bg-[#C4607F]/10 px-4 py-3 text-sm text-[#9c3d5c] ring-1 ring-[#C4607F]/30">
            Този линк за достъп вече не работи: спрян е или е изтекъл. Поискай нов от екипа.
          </p>
        )}
        {dostap === "expired" && (
          <p className="mt-4 rounded-2xl bg-[#C4607F]/10 px-4 py-3 text-sm text-[#9c3d5c] ring-1 ring-[#C4607F]/30">
            Връзката за вход е изтекла. Поискай нова от{" "}
            <Link href="/dostap" className="underline">страницата за вход с имейл</Link>.
          </p>
        )}
        <LoginForm needsTotp={isTotpConfigured()} />
      </div>
    </div>
  );
}
