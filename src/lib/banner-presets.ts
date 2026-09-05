/**
 * The sizes the social networks actually crop to.
 *
 * A banner drawn for one network and uploaded to another loses whatever sits
 * outside that network's frame - LinkedIn's page cover is nearly six times
 * wider than it is tall, so a 4:1 design arrives with its logo row cut off.
 * Each preset here is drawn for its own frame instead.
 */
export type BannerLayout = "strip" | "wide" | "square" | "story";

export type BannerPreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  layout: BannerLayout;
  /** What it is for, in the admin list. */
  note: string;
};

export const BANNERS: BannerPreset[] = [
  {
    id: "linkedin-cover",
    label: "LinkedIn · корица на страница",
    // LinkedIn's own recommendation, and the one their uploader accepts:
    // 1512×256 sits above their stated minimum but was refused, which is a
    // known trap - the picture has to be big enough for the size it is shown at.
    width: 4200,
    height: 700,
    layout: "strip",
    note: "4200×700 - препоръчаният от LinkedIn размер за корица на фирмена страница",
  },
  {
    id: "x-header",
    label: "X / Twitter · заглавна снимка",
    width: 1500,
    height: 500,
    layout: "wide",
    note: "1500×500",
  },
  {
    id: "facebook-cover",
    label: "Facebook · корица на страница",
    width: 1640,
    height: 624,
    layout: "wide",
    note: "1640×624 - на телефон се реже отстрани, затова важното е в средата",
  },
  {
    id: "og",
    label: "Връзка в публикация (LinkedIn, Facebook)",
    width: 1200,
    height: 630,
    layout: "wide",
    note: "1200×630 - картинката, която се показва при споделяне на връзка",
  },
  {
    id: "ig-square",
    label: "Instagram · пост",
    width: 1080,
    height: 1080,
    layout: "square",
    note: "1080×1080",
  },
  {
    id: "ig-portrait",
    label: "Instagram · висок пост",
    width: 1080,
    height: 1350,
    layout: "square",
    note: "1080×1350 - заема повече място във фийда",
  },
  {
    id: "ig-story",
    label: "Instagram · стори",
    width: 1080,
    height: 1920,
    layout: "story",
    note: "1080×1920 - горните и долните 250 пиксела остават празни за бутоните",
  },
];

export const bannerPreset = (id: string) => BANNERS.find((b) => b.id === id);
