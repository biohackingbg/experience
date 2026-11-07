"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Re-reads the page every few seconds, so a payment shows up without a tap. */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  const [at, setAt] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
      setAt(new Date());
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return <span className="font-mono text-[0.65rem] text-bh-ink/45">обновено {at.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>;
}
