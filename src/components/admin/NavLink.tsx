"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** A sidebar entry that knows whether it is the page being looked at. */
export function NavLink({
  href,
  label,
  icon,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number | null;
}) {
  const pathname = usePathname();
  const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] transition-colors ${
        active ? "font-semibold text-[#0b2a22]" : "text-[#0b2a22]/60 hover:bg-[#0b2a22]/5 hover:text-[#0b2a22]"
      }`}
    >
      {active && (
        <span aria-hidden className="absolute -left-4 top-1/2 h-7 w-1.5 -translate-y-1/2 rounded-r-full bg-[#146455]" />
      )}
      <span className={`h-5 w-5 shrink-0 ${active ? "text-[#146455]" : ""}`}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="rounded-md bg-[#0b2a22] px-1.5 py-0.5 text-[0.62rem] font-semibold text-white">{badge}</span>
      ) : null}
    </Link>
  );
}
