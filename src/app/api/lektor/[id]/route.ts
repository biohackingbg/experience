import { getPhoto } from "@/lib/speakers-data";

export const dynamic = "force-dynamic";

/**
 * The portrait at its old address, kept for links made before the stamp
 * moved into the path (/api/lektor/<id>/<stamp>). Same bytes, same caching.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return new Response("not found", { status: 404 });
  const p = await getPhoto(id);
  if (!p) return new Response("not found", { status: 404 });
  return new Response(new Uint8Array(p.bytes), {
    headers: {
      "content-type": p.mime,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
