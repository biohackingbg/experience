import { canAccess } from "@/lib/access";
import { sequencePreview } from "@/lib/sequences";

export const dynamic = "force-dynamic";

/** One automatic letter, rendered with sample data, for the iframe on the mail page. */
export async function GET(_req: Request, ctx: { params: Promise<{ kind: string }> }) {
  if (!(await canAccess("pisma"))) return new Response("unauthorized", { status: 401 });
  const { kind } = await ctx.params;
  const letter = await sequencePreview(kind);
  if (!letter) return new Response("not found", { status: 404 });
  return new Response(letter.html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Framed only by our own mail page; nothing in here may run or reach out.
      "content-security-policy": "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; frame-ancestors 'self'",
      "x-frame-options": "SAMEORIGIN",
      "x-robots-tag": "noindex",
    },
  });
}
