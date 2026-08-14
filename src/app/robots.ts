import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // The partner deck is a sales document shared by link, not a public page.
    rules: { userAgent: "*", allow: "/", disallow: "/za-partniori.html" },
    sitemap: "https://thelongevitysummit.eu/sitemap.xml",
  };
}
