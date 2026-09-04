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
