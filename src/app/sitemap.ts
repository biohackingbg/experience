import type { MetadataRoute } from "next";

const SITE = "https://thelongevitysummit.eu";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
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
      url: `${SITE}/poveritelnost`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
