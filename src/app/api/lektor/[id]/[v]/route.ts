import { getPhoto } from "@/lib/speakers-data";

export const dynamic = "force-dynamic";

/**
 * A speaker's portrait, with the upload stamp in the path rather than in a
 * query string: Next's image optimizer will only resize a local source
 * whose search string is declared in advance, and this one changes with
 * every upload. In the path it is just another cache key, so the portraits
 * can go through the optimizer and reach a phone at a tenth of the weight.
 *
 * The stamp itself is not checked - it exists to move the URL when the
 * photo changes, and the id is what identifies the person.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string; v: string }> }) {
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
