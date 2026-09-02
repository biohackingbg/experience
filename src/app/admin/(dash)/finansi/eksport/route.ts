import { isAdmin } from "@/lib/admin-auth";
import { financesCsv, getFinances } from "@/lib/finances";

export const dynamic = "force-dynamic";

/** The whole ledger as one CSV, for the accountant's spreadsheet. */
export async function GET() {
  if (!(await isAdmin())) return new Response("Няма достъп.", { status: 401 });
  const csv = financesCsv(await getFinances());
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sofia-life-summit-finansi-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
