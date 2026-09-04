import Link from "next/link";

import type { Lang } from "@/lib/i18n";
import { getNotice, noticeText } from "@/lib/notice";

/**
 * The organiser's one sentence, above everything. It links to the tickets,
 * because every reason to run it ends there; it renders nothing at all when
 * it is off, so the page starts at the header as usual.
 */
export async function SiteNotice({ lang = "bg" }: { lang?: Lang }) {
  const notice = await getNotice();
  if (!notice.on) return null;
  const text = noticeText(notice, lang);
  if (!text) return null;

  return (
    <Link
      href={lang === "en" ? "/en#tickets" : "/#tickets"}
      className="bh-gradient block px-5 py-2.5 text-center text-sm font-semibold text-bh-ink transition-opacity hover:opacity-90 sm:px-8"
    >
      {text}
    </Link>
  );
}
