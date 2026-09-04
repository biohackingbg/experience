import { isAdmin } from "@/lib/admin-auth";
import { isMailKind, mailPreview } from "@/lib/mail-samples";

export const dynamic = "force-dynamic";

/** The rendered mail, for the iframe on the mail page. Sample data only. */
export async function GET(_req: Request, ctx: { params: Promise<{ kind: string }> }) {
  if (!(await isAdmin())) return new Response("unauthorized", { status: 401 });
  const { kind } = await ctx.params;
  if (!isMailKind(kind)) return new Response("not found", { status: 404 });
  return new Response(mailPreview(kind).html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Nothing in here may run or reach out; it is a picture of an email.
      "content-security-policy": "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'",
      "x-robots-tag": "noindex",
    },
  });
}
