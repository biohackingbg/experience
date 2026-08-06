import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isAdmin } from "@/lib/admin-auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Вход | Администрация",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center rounded-[1.75rem] bg-bh-paper px-5">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight text-bh-ink">
          Администрация
        </h1>
        <p className="mt-2 text-sm text-bh-ink/60">
          Sofia Life Summit — продажби и статистика.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
