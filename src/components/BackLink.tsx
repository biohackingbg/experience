import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowLeft } from "@/components/ui/Pictograms";

/**
 * "Back to the site": the arrow sits in the same ink disc with the lime
 * arrow as the round buttons on the home page, instead of a typed "←" in
 * front of the words. The two tokens flip together with the theme.
 */
export function BackLink({
  href = "/",
  className = "",
  children,
}: {
  href?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-bh-ink/60 transition-colors hover:text-bh-ink ${className}`}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-bh-ink text-bh-lime transition-transform group-hover:-translate-x-0.5">
        <ArrowLeft className="h-4 w-4" aria-hidden />
      </span>
      {children}
    </Link>
  );
}
