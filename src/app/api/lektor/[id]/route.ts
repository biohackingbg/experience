import { getPhoto } from "@/lib/speakers-data";

export const dynamic = "force-dynamic";

/**
 * A speaker's portrait. The ?v= stamp changes with each upload, so this can
 * be cached hard.
 *
 * ?w= asks for a width. The cards are at most ~340 CSS pixels wide, so a
 * phone downloading the full upload wastes most of what it fetches; the
 * widths here cover 1x and 2x for the grid and the badge.
 *
 * The resizer is loaded lazily and inside a try: sharp carries a native
 * binary per platform, and a portrait must never fail to load because that
 * binary is missing on the machine serving it. Anything unexpected - an
 * unknown width, a broken image, no sharp at all - serves the stored
 * original, which is what this route did before it could resize.
 */
const WIDTHS = new Set([160, 320, 480, 640]);

async function resize(bytes: Buffer, width: number): Promise<{ body: Buffer; mime: string } | null> {
  try {
    const { default: sharp } = await import("sharp");
    const body = await sharp(bytes).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    return { body, mime: "image/webp" };
  } catch (error) {
    console.error("[lektor] resize failed, serving the original:", error);
    return null;
  }
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return new Response("not found", { status: 404 });
  const p = await getPhoto(id);
  if (!p) return new Response("not found", { status: 404 });

  const asked = Number(new URL(req.url).searchParams.get("w"));
  const smaller = WIDTHS.has(asked) ? await resize(p.bytes, asked) : null;
  const body = smaller?.body ?? p.bytes;
  const mime = smaller?.mime ?? p.mime;

  return new Response(new Uint8Array(body), {
    headers: {
      "content-type": mime,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
