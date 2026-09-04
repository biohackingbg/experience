import type { Metadata } from "next";
import QRCode from "qrcode";

import { PrintButton } from "@/components/admin/PrintButton";
import { requireAccess } from "@/lib/access";
import { listAttendees } from "@/lib/tickets-lookup";

export const metadata: Metadata = {
  title: "Баджове | Администрация",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Badges, four to an A4 sheet, cut along the marks. Name large, tier in
 * the corner, the ticket's QR so the badge itself can be scanned at a
 * workshop door. Print to PDF from the browser: that is the PDF.
 */
export default async function BadgesPage() {
  await requireAccess("vhod");
  const rows = await listAttendees();
  const badges = await Promise.all(
    rows.map(async (r) => ({
      ...r,
      qr: await QRCode.toString(r.code, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#02251f", light: "#0000" } }),
    })),
  );

  return (
    <div className="min-h-screen bg-white text-[#02251f]">
      <style>{`
        @page { size: A4 portrait; margin: 8mm; }
        @media print { .no-print { display: none !important; } .sheet { break-after: page; } }
        .sheet { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 6mm; width: 194mm; height: 281mm; margin: 0 auto; }
        .badge { border: 0.3mm dashed #c9cfca; border-radius: 4mm; padding: 8mm; display: flex; flex-direction: column; justify-content: space-between; }
      `}</style>
      <div className="no-print mx-auto flex max-w-[194mm] items-center justify-between px-2 py-4">
        <p className="text-sm text-[#02251f]/70">{rows.length} баджа · {Math.ceil(rows.length / 4)} листа A4 · режат се по пунктира</p>
        <PrintButton label="Печат / PDF" />
      </div>
      {Array.from({ length: Math.ceil(badges.length / 4) }, (_, s) => (
        <div key={s} className="sheet">
          {badges.slice(s * 4, s * 4 + 4).map((b) => (
            <div key={b.code} className="badge">
              <div className="flex items-start justify-between">
                <div className="font-mono text-[9pt] uppercase tracking-[0.2em] text-[#146455]">Sofia Life Summit</div>
                <div className="rounded-full bg-[#02251f] px-3 py-1 text-[9pt] font-bold uppercase tracking-wide text-[#cef870]">{b.tierName}</div>
              </div>
              <div>
                <div className="text-[22pt] font-black leading-tight tracking-tight">{b.name}</div>
                {b.company && <div className="mt-1 text-[11pt] text-[#02251f]/60">{b.company}</div>}
              </div>
              <div className="flex items-end justify-between">
                <div className="text-[8pt] text-[#02251f]/50">07-08 ноември 2026 · Гранд Хотел Милениум<br />{b.code}</div>
                <div className="h-[22mm] w-[22mm] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: b.qr }} />
              </div>
            </div>
          ))}
        </div>
      ))}
      {rows.length === 0 && <p className="no-print p-8 text-center text-sm text-[#02251f]/60">Още няма платени билети.</p>}
    </div>
  );
}
