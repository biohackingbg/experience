import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { bannerPreset, type BannerPreset } from "@/lib/banner-presets";

export const dynamic = "force-dynamic";

const INK = "#02251f";
const LIME = "#cef870";

async function dataUri(file: string, mime: string) {
  const bytes = await readFile(join(process.cwd(), "public", file));
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

/** Satori cannot synthesise weights, so the display cut is fetched as TTF. */
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
    return null;
  }
}

/** The molecule motif, faint, as a few rings and joins rather than an image. */
function Molecules({ w, h }: { w: number; h: number }) {
  const ring = (size: number, left: number, top: number, o: number) => (
    <div
      key={`${left}-${top}`}
      style={{
        position: "absolute",
        left,
        top,
        width: size,
        height: size,
        borderRadius: size,
        border: `${Math.max(2, size * 0.06)}px solid rgba(206,248,112,${o})`,
        display: "flex",
      }}
    />
  );
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", overflow: "hidden" }}>
      {ring(h * 1.1, -h * 0.3, -h * 0.35, 0.07)}
      {ring(h * 0.55, w - h * 0.5, h * 0.35, 0.09)}
      {ring(h * 0.28, w - h * 0.95, -h * 0.1, 0.06)}
      {ring(h * 0.4, w * 0.62, h * 0.72, 0.05)}
    </div>
  );
}

function Logos({ ours, partner, height }: { ours: string; partner: string; height: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: height * 0.6 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={partner} alt="" height={height} />
      <div style={{ display: "flex", width: 1, height: height * 0.85, background: "rgba(255,255,255,0.25)" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ours} alt="" height={height * 0.72} />
    </div>
  );
}

function Banner({ p, ours, partner }: { p: BannerPreset; ours: string; partner: string }) {
  const { width: w, height: h, layout } = p;
  const pad = layout === "strip" ? h * 0.22 : Math.min(w, h) * 0.1;
  const base = { width: "100%", height: "100%", display: "flex", background: INK, position: "relative" as const };

  const title = (size: number, stacked: boolean) => (
    <div
      style={{
        display: "flex",
        flexDirection: stacked ? "column" : "row",
        alignItems: "baseline",
        gap: stacked ? 0 : size * 0.22,
        fontFamily: "Sofia Sans",
        fontWeight: 900,
        fontSize: size,
        lineHeight: 0.95,
        letterSpacing: -size * 0.03,
        color: "#ffffff",
        textTransform: "uppercase",
      }}
    >
      <div style={{ display: "flex" }}>Sofia Life Summit</div>
      <div style={{ display: "flex", color: LIME }}>2026</div>
    </div>
  );

  // `short` drops the venue: in a six-to-one frame the three lines together
  // are wider than the space left beside the name, and the venue is the line
  // a page description already carries.
  const meta = (size: number, column: boolean, short = false) => (
    <div
      style={{
        display: "flex",
        flexDirection: column ? "column" : "row",
        gap: column ? size * 0.5 : size * 0.9,
        fontSize: size,
        letterSpacing: size * 0.1,
        color: "rgba(255,255,255,0.72)",
        textTransform: "uppercase",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex" }}>07-08 ноември 2026</div>
      {!short && <div style={{ display: "flex" }}>Гранд Хотел Милениум, София</div>}
      <div style={{ display: "flex", color: LIME }}>thelongevitysummit.eu</div>
    </div>
  );

  // A single wide line: logos, then the name, then the details - nothing
  // stacked, because there is no room to stack in a 6:1 frame.
  if (layout === "strip") {
    // LinkedIn lays its own page avatar over the bottom-left of the cover -
    // measured on the live page, it covers the first fifth of the width - so
    // the row starts clear of it rather than behind it.
    return (
      <div style={{ ...base, alignItems: "center", justifyContent: "space-between", padding: `0 ${pad}px 0 ${w * 0.22}px` }}>
        <Molecules w={w} h={h} />
        <div style={{ display: "flex", alignItems: "center", gap: pad * 0.9, position: "relative" }}>
          <Logos ours={ours} partner={partner} height={h * 0.22} />
          {title(h * 0.175, false)}
        </div>
        <div style={{ display: "flex", position: "relative" }}>{meta(h * 0.066, true, true)}</div>
      </div>
    );
  }

  if (layout === "story") {
    return (
      <div style={{ ...base, flexDirection: "column", justifyContent: "center", gap: h * 0.06, padding: `${h * 0.16}px ${pad}px` }}>
        <Molecules w={w} h={h} />
        <div style={{ display: "flex", position: "relative" }}>
          <Logos ours={ours} partner={partner} height={w * 0.09} />
        </div>
        <div style={{ display: "flex", position: "relative" }}>{title(w * 0.155, true)}</div>
        <div style={{ display: "flex", position: "relative" }}>{meta(w * 0.032, true)}</div>
      </div>
    );
  }

  const stacked = layout === "square";
  return (
    <div
      style={{
        ...base,
        flexDirection: "column",
        justifyContent: "space-between",
        padding: pad,
      }}
    >
      <Molecules w={w} h={h} />
      <div style={{ display: "flex", position: "relative" }}>
        <Logos ours={ours} partner={partner} height={Math.min(w, h) * 0.09} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: Math.min(w, h) * 0.05, position: "relative" }}>
        {title(stacked ? w * 0.13 : w * 0.1, true)}
        {meta(Math.min(w, h) * 0.028, true)}
      </div>
    </div>
  );
}

/**
 * Ready-made banners in each network's own frame, drawn from the same facts
 * the site shows - so a date that changes on the site changes here too.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ preset: string }> }) {
  const { preset } = await ctx.params;
  const p = bannerPreset(preset);
  if (!p) return new Response("not found", { status: 404 });

  const [ours, partner, font] = await Promise.all([
    dataUri("logo-dark.svg", "image/svg+xml"),
    dataUri("partner-logo.png", "image/png"),
    loadDisplayFont(),
  ]);

  return new ImageResponse(<Banner p={p} ours={ours} partner={partner} />, {
    width: p.width,
    height: p.height,
    fonts: font ? [{ name: "Sofia Sans", data: font, weight: 900, style: "normal" }] : undefined,
  });
}
