import type { MetadataRoute } from "next";

import { listSpeakerPages } from "@/lib/speakers-data";

const SITE = "https://thelongevitysummit.eu";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A page per announced speaker: the addresses people reach by searching a
  // name rather than the event.
  let speakers: MetadataRoute.Sitemap = [];
  try {
    const rows = await listSpeakerPages();
    speakers = rows.flatMap((r) => [
      { url: `${SITE}/lektor/${r.id}`, lastModified: r.updatedAt ?? undefined, changeFrequency: "monthly" as const, priority: 0.6 },
      { url: `${SITE}/en/lektor/${r.id}`, lastModified: r.updatedAt ?? undefined, changeFrequency: "monthly" as const, priority: 0.5 },
    ]);
  } catch {
    // A sitemap without the speakers beats a build that fails over them.
  }

  return [
    ...speakers,
    {
      url: SITE,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      // The page the whole site exists to reach. It was missing here, so the
      // one URL worth ranking for "билети Sofia Life Summit" was the one
      // search engines were never told about.
      url: `${SITE}/bilet`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE}/en`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE}/programa`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE}/en/programa`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE}/usloviya`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE}/poveritelnost`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
