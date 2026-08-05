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
      url: `${SITE}/poveritelnost`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
