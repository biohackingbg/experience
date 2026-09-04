/** Option lists for the marketing log, importable by client forms (no server code here). */

export const PLATFORMS = [
  { id: "instagram", label: "Instagram", hosts: ["instagram.com", "l.instagram.com", "www.instagram.com"] },
  { id: "facebook", label: "Facebook", hosts: ["facebook.com", "m.facebook.com", "l.facebook.com", "lm.facebook.com", "www.facebook.com"] },
  { id: "linkedin", label: "LinkedIn", hosts: ["linkedin.com", "www.linkedin.com", "lnkd.in"] },
  { id: "tiktok", label: "TikTok", hosts: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com"] },
  { id: "youtube", label: "YouTube", hosts: ["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"] },
  { id: "google", label: "Google", hosts: ["google.com", "www.google.com", "google.bg", "www.google.bg", "googleads.g.doubleclick.net"] },
  { id: "newsletter", label: "Имейл бюлетин", hosts: [] },
  { id: "other", label: "Друго", hosts: [] },
] as const;
export type PlatformId = (typeof PLATFORMS)[number]["id"];
export const isPlatform = (v: unknown): v is PlatformId => PLATFORMS.some((p) => p.id === v);
export const platformLabel = (id: string) => PLATFORMS.find((p) => p.id === id)?.label ?? id;

export const KINDS = [
  { id: "post", label: "Пост" },
  { id: "story", label: "Стори" },
  { id: "reel", label: "Reel / видео" },
  { id: "ad", label: "Платена реклама" },
  { id: "newsletter", label: "Бюлетин" },
  { id: "other", label: "Друго" },
] as const;
export type KindId = (typeof KINDS)[number]["id"];
export const isKind = (v: unknown): v is KindId => KINDS.some((k) => k.id === v);
export const kindLabel = (id: string) => KINDS.find((k) => k.id === id)?.label ?? id;

export const SITE = "https://thelongevitysummit.eu";

/** The link to put in the post: the site, tagged so visits and sales can be counted for it. */
export function campaignLink(platform: string, utmCampaign: string, path = "/"): string {
  const u = new URL(path, SITE);
  u.searchParams.set("utm_source", platform);
  u.searchParams.set("utm_campaign", utmCampaign);
  return u.toString();
}
