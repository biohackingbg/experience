import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Sofia Life Summit - 07-08 ноември 2026, Гранд Хотел Милениум, София";

async function dataUri(file: string, mime: string) {
  const bytes = await readFile(join(process.cwd(), "public", file));
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

/**
 * Satori needs real font data - it cannot synthesise a bold weight, and the
 * built-in fallback ships a single regular cut, which left the headline
 * looking light. Google serves TTF (not woff2, which Satori cannot read) when
 * the request looks like an old browser.
 */
async function loadDisplayFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Sofia+Sans:wght@900&subset=cyrillic,latin",
      { headers: { "User-Agent": "Mozilla/5.0 (compatible; Satori)" } },
    ).then((r) => r.text());

    const url = css.match(/src:\s*url\((https:\/\/[^)]+)\)/)?.[1];
    if (!url) return null;

    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    // Rendering a plainer card beats failing the whole image.
    return null;
  }
}

export default async function OpengraphImage() {
  const [ours, partner, font] = await Promise.all([
    dataUri("logo-dark.svg", "image/svg+xml"),
    dataUri("partner-logo.png", "image/png"),
    loadDisplayFont(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#02251f",
          padding: "68px 72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 6,
              color: "#cef870",
              textTransform: "uppercase",
            }}
          >
            07-08.11.2026
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 24,
              fontSize: 118,
              fontFamily: "Sofia Sans",
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: -3,
              color: "#ffffff",
              textTransform: "uppercase",
            }}
          >
            <div style={{ display: "flex" }}>Sofia Life</div>
            <div style={{ display: "flex" }}>Summit</div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 30,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            Гранд Хотел Милениум, София
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 34,
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingTop: 30,
          }}
        >
          {/* Their artwork is fixed dark teal and rose, which all but vanishes
              on this background. A light plate keeps their colours exact
              instead of recolouring the mark. */}
          <div
            style={{
              display: "flex",
              background: "#f6f7f4",
              borderRadius: 14,
              padding: "12px 20px",
            }}
          >
            { }
            <img src={partner} alt="" height={64} />
          </div>
          <div
            style={{
              display: "flex",
              width: 1,
              height: 54,
              background: "rgba(255,255,255,0.2)",
            }}
          />
          { }
          <img src={ours} alt="" height={46} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "Sofia Sans", data: font, weight: 900, style: "normal" }]
        : undefined,
    },
  );
}
