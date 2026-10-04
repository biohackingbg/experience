import { getLogo } from "@/lib/partner-profiles";

export const dynamic = "force-dynamic";

/**
 * A partner's logo. The upload stamp sits in the path so a new logo gets a
 * new URL and every cache can keep the old one forever; the id alone says
 * whose logo it is.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string; v: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("not found", { status: 404 });
  const logo = await getLogo(id);
  if (!logo) return new Response("not found", { status: 404 });
  return new Response(new Uint8Array(logo.bytes), {
    headers: {
      "content-type": logo.mime,
      "cache-control": "public, max-age=31536000, immutable",
      "access-control-allow-origin": "*",
    },
  });
}
