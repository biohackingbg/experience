import sharp from "sharp";

import { getPhoto } from "@/lib/speakers-data";

export const dynamic = "force-dynamic";

/**
 * A speaker's portrait. The ?v= stamp changes with each upload, so this can
 * be cached hard.
 *
 * ?w= asks for a width. The cards are at most ~340 CSS pixels wide, so a
 * phone downloading the full upload wastes most of what it fetches; the
 * widths here cover 1x and 2x for the grid and the badge. Anything else
 * falls back to the stored original, and so does a resize that fails - a
 * portrait must never 404 because an image library had an opinion.
 */
const WIDTHS = new Set([160, 320, 480, 640]);

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return new Response("not found", { status: 404 });
  const p = await getPhoto(id);
  if (!p) return new Response("not found", { status: 404 });

  const asked = Number(new URL(req.url).searchParams.get("w"));
  let bytes = new Uint8Array(p.bytes).slice().buffer as ArrayBuffer;
  let mime = p.mime;
  if (WIDTHS.has(asked)) {
    try {
      const out = await sharp(p.bytes).rotate().resize({ width: asked, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
      bytes = new Uint8Array(out).slice().buffer as ArrayBuffer;
      mime = "image/webp";
    } catch {
      // Keep the original: a slightly heavy portrait beats a broken one.
    }
  }

  return new Response(bytes, {
    headers: {
      "content-type": mime,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
