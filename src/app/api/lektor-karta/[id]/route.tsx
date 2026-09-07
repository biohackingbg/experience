import { ImageResponse } from "next/og";

import { getPhoto, listSpeakers } from "@/lib/speakers-data";

export const dynamic = "force-dynamic";

const INK = "#02251f";
const LIME = "#cef870";
const TEAL = "#5fd4c0";

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
  const pad = Math.round(w * 0.075);
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
            <div style={{ display: "flex", fontSize: 20, letterSpacing: 6, color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>
              [ Sofia Life Summit ]
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 18, letterSpacing: 6, color: LIME, textTransform: "uppercase", marginBottom: 10 }}>
                {en ? "On stage" : "На сцената"}
              </div>
              <div style={{ display: "flex", fontFamily: "Sofia Sans", fontWeight: 900, fontSize: name.length > 30 ? 42 : 54, lineHeight: 1.05, color: "#ffffff" }}>
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
      { width: w, height: h, fonts },
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
        {/* The words sit on the picture, so the picture darkens under them. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage: `linear-gradient(to bottom, rgba(2,37,31,0.55) 0%, rgba(2,37,31,0) 28%, rgba(2,37,31,0.35) 55%, rgba(2,37,31,0.95) 82%)`,
          }}
        />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: pad }}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            <div
              style={{
                display: "flex",
                fontSize: Math.round(w * 0.028),
                letterSpacing: Math.round(w * 0.008),
                color: "rgba(255,255,255,0.85)",
                textTransform: "uppercase",
              }}
            >
              [ Sofia Life Summit ]
            </div>
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
                {en ? "On stage" : "На сцената"}
              </div>
            )}
            <div
              style={{
                display: "flex",
                fontFamily: "Sofia Sans",
                fontWeight: 900,
                fontSize: Math.round(w * 0.082),
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
    { width: w, height: h, fonts },
  );
}
