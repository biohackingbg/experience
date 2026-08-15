import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // The partner deck is shared by link with prospective sponsors; it is
    // not a page anyone should reach from a search result.
    rules: { userAgent: "*", allow: "/", disallow: "/za-partniori" },
    sitemap: "https://thelongevitysummit.eu/sitemap.xml",
  };
}
