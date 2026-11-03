// Renders the installable-app icons from the site's favicon: the round mark
// on the brand ink, with enough margin that Android's circular and squircle
// masks never clip it (the maskable safe zone is the middle 80%).
import { readFileSync } from "node:fs";
import sharp from "sharp";

const INK = "#02251f";
const mark = readFileSync("src/app/icon.svg");

for (const size of [192, 512]) {
  const inner = Math.round(size * 0.6);
  const m = await sharp(mark).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: INK } })
    .composite([{ input: m, gravity: "centre" }])
    .png()
    .toFile(`public/icons/app-${size}.png`);
}
