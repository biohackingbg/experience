"use client";

import { usePathname, useSearchParams } from "next/navigation";

/**
 * The order search in the top bar. On most pages it opens the dashboard's
 * order list; on the invoices page it searches the invoices instead, so
 * typing a name there does not throw the person back to the dashboard.
 */
export function AdminSearch() {
  const pathname = usePathname();
  const q = useSearchParams().get("q") ?? "";
  const onInvoices = pathname.startsWith("/admin/fakturi");

  return (
    <form action={onInvoices ? "/admin/fakturi" : "/admin"} method="get" className="flex min-w-[16rem] flex-1 items-center gap-3 rounded-full bg-white px-4 py-2.5 ring-1 ring-[#0b2a22]/8 sm:max-w-md">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-[#0b2a22]/50"><circle cx="9" cy="9" r="5.5"/><path d="M13.5 13.5 17 17" strokeLinecap="round"/></svg>
      <input
        // Remounted when the page or the query changes, so the box shows what was searched.
        key={`${onInvoices}:${q}`}
        type="search"
        name="q"
        defaultValue={onInvoices ? q : ""}
        placeholder={onInvoices ? "Търси фактура: номер, поръчка, имейл или име" : "Търси поръчка: номер, имейл или име"}
        className="w-full bg-transparent text-sm text-[#0b2a22] outline-none placeholder:text-[#0b2a22]/40"
      />
    </form>
  );
}
