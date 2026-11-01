import { ImageResponse } from "next/og";

import { getPhoto, listSpeakers } from "@/lib/speakers-data";

export const dynamic = "force-dynamic";

/**
 * The cards are link-preview images (og:image on every speaker page), so
 * every share, crawler and chat app fetches one - and each fetch used to
 * render the PNG afresh and read the portrait and the whole speaker list
 * from the database. An hour at the CDN (a day of stale-while-revalidate)
 * keeps that to one render per card an hour; the admin sees an edit within
 * the hour, or at once with a hard refresh of the card link.
 */
/**
 * The darkening under the words, as one SVG gradient laid over the photo.
 * Flat bands (the earlier way) left hairlines of the photograph between them
 * on pale pictures; a gradient inside an image has no seams, and resvg, not
 * Satori, draws its stops where they are written.
 */
function scrimSrc(w: number, h: number): string {
  const steps = 24;
  const stops = Array.from({ length: steps }, (_, i) => {
    const t = i / (steps - 1);
    const a = Math.min(1, t ** 1.5 * 1.06);
    return `<stop offset="${(t * 100).toFixed(1)}%" stop-color="#02251f" stop-opacity="${a.toFixed(3)}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const CARD_CACHE = { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" };

const INK = "#02251f";
const LIME = "#cef870";
const TEAL = "#5fd4c0";

/**
 * The event's name as a solid tag rather than loose type on the picture: a
 * pale photograph, or a face near the top, swallowed the old white text and
 * no scrim short of a black bar would have saved it.
 */
const Tag = ({ size, pad }: { size: number; pad: number }) => (
  <div
    style={{
      display: "flex",
      background: "rgba(2,37,31,0.88)",
      color: LIME,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: Math.round(size * 0.28),
      textTransform: "uppercase",
      padding: `${Math.round(pad * 0.55)}px ${pad}px ${Math.round(pad * 0.55)}px ${pad + Math.round(size * 0.28)}px`,
      borderRadius: 999,
    }}
  >
    Sofia Life Summit
  </div>
);

/** The shapes a card gets posted in. */
const SIZES = {
  portrait: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  /** LinkedIn reads landscape, so that one is composed side by side. */
  landscape: { width: 1200, height: 627 },
} as const;
type SizeId = keyof typeof SIZES;
const isSize = (v: string | null): v is SizeId => v !== null && v in SIZES;

async function font(weight: 400 | 900): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Sofia+Sans:wght@${weight}&subset=cyrillic,latin`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; Satori)" } },
    ).then((r) => r.text());
    const url = css.match(/src:\s*url\((https:\/\/[^)]+)\)/)?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

/**
 * A speaker card, drawn from the line-up itself.
 *
 * The team's cards said "НОВ ЛЕКТОР" on every one, which stopped being true
 * the day the whole line-up went up; these carry the person's actual role
 * instead, and the name, speciality and institution come from the same rows
 * the site shows - correct a title in the admin and the card is corrected.
 */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return new Response("not found", { status: 404 });

  const url = new URL(req.url);
  const sizeId: SizeId = isSize(url.searchParams.get("size")) ? (url.searchParams.get("size") as SizeId) : "portrait";
  const { width: w, height: h } = SIZES[sizeId];
  const en = url.searchParams.get("lang") === "en";

  const [speaker, photo, bold, regular] = await Promise.all([
    listSpeakers().then((all) => all.find((s) => s.id === id)),
    getPhoto(id),
    font(900),
    font(400),
  ]);
  if (!speaker) return new Response("not found", { status: 404 });

  const title = (en ? speaker.titleEn : null) || speaker.title || "";
  const specialty = (en ? speaker.specialtyEn : null) || speaker.specialty || "";
  const role = (en ? speaker.roleEn : null) || speaker.role || "";
  const affiliation = (en ? speaker.affiliationEn : null) || speaker.affiliation || "";
  const credit = [role, affiliation].filter(Boolean).join(", ");
  const dates = en ? "7-8 NOVEMBER 2026 · SOFIA" : "07-08.11.2026 · СОФИЯ";
  // Only a fixed set of labels: the route is public, and a free-text label
  // would let anyone put their own words on a card carrying our name.
  const LABELS = { stage: ["На сцената", "On stage"], participant: ["Участник", "Participant"] } as const;
  const labelKey = url.searchParams.get("label");
  const kicker = LABELS[(labelKey && labelKey in LABELS ? labelKey : "stage") as keyof typeof LABELS][en ? 1 : 0];
  const pad = Math.round(w * 0.075);
  const scrimH = Math.round(h * 0.62);
  const src = photo ? `data:${photo.mime};base64,${photo.bytes.toString("base64")}` : null;
  const name = [title, speaker.name].filter(Boolean).join(" ");
  const fonts = [
    ...(bold ? [{ name: "Sofia Sans", data: bold, weight: 900 as const, style: "normal" as const }] : []),
    ...(regular ? [{ name: "Sofia Sans", data: regular, weight: 400 as const, style: "normal" as const }] : []),
  ];

  if (sizeId === "landscape") {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", background: INK }}>
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="" width={420} height={h} style={{ width: 420, height: h, objectFit: "cover", objectPosition: "top" }} />
          ) : (
            <div style={{ display: "flex", width: 420, height: h, background: "#0a3229" }} />
          )}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1, padding: "54px 60px" }}>
            <div style={{ display: "flex" }}>
              <Tag size={18} pad={22} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 18, letterSpacing: 6, color: LIME, textTransform: "uppercase", marginBottom: 10 }}>
                {kicker}
              </div>
              <div style={{ display: "flex", maxWidth: 660, fontFamily: "Sofia Sans", fontWeight: 900, fontSize: name.length > 24 ? 40 : 54, lineHeight: 1.05, color: "#ffffff" }}>
                {name}
              </div>
              {specialty && (
                <div style={{ display: "flex", fontSize: 26, color: "rgba(255,255,255,0.9)", marginTop: 8 }}>{specialty}</div>
              )}
              {credit && <div style={{ display: "flex", fontSize: 21, color: TEAL, marginTop: 8 }}>{credit}</div>}
            </div>
            <div style={{ display: "flex", gap: 22, fontSize: 19, letterSpacing: 4, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
              <div style={{ display: "flex" }}>{dates}</div>
              <div style={{ display: "flex", color: LIME }}>thelongevitysummit.eu</div>
            </div>
          </div>
        </div>
      ),
      { width: w, height: h, fonts, headers: CARD_CACHE },
    );
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: INK }}>
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            width={w}
            height={h}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />
        )}
        {/* The words sit on the picture, so the picture darkens under them. No band at the top: the tag carries its own ground. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={scrimSrc(w, scrimH)} alt="" width={w} height={scrimH} style={{ position: "absolute", left: 0, bottom: 0, width: w, height: scrimH }} />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: pad }}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <Tag size={Math.round(w * 0.026)} pad={Math.round(w * 0.028)} />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {specialty && (
              <div
                style={{
                  display: "flex",
                  fontSize: Math.round(w * 0.026),
                  letterSpacing: Math.round(w * 0.007),
                  color: LIME,
                  textTransform: "uppercase",
                  marginBottom: Math.round(h * 0.012),
                }}
              >
                {kicker}
              </div>
            )}
            <div
              style={{
                display: "flex",
                fontFamily: "Sofia Sans",
                fontWeight: 900,
                // A name and title of about this length leaves one word alone on a second line at the full size.
                fontSize: Math.round(w * (name.length >= 24 && name.length <= 28 ? 0.066 : 0.082)),
                lineHeight: 1.05,
                letterSpacing: -Math.round(w * 0.002),
                color: "#ffffff",
              }}
            >
              {name}
            </div>
            {specialty && (
              <div style={{ display: "flex", fontSize: Math.round(w * 0.042), color: "rgba(255,255,255,0.9)", marginTop: Math.round(h * 0.008) }}>
                {specialty}
              </div>
            )}
            {credit && (
              <div style={{ display: "flex", fontSize: Math.round(w * 0.032), color: TEAL, marginTop: Math.round(h * 0.01) }}>{credit}</div>
            )}
            <div
              style={{
                display: "flex",
                fontSize: Math.round(w * 0.026),
                letterSpacing: Math.round(w * 0.007),
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase",
                marginTop: Math.round(h * 0.018),
              }}
            >
              {dates}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: w, height: h, fonts, headers: CARD_CACHE },
  );
}
