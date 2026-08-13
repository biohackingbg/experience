import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Both hostnames were serving the site with a 200, so every page
        // existed at two addresses at once. The canonical tag told Google
        // which one counts, but a redirect settles it for everything else —
        // shared links, analytics, and the cookie/session origin.
        source: "/:path*",
        has: [{ type: "host", value: "www.thelongevitysummit.eu" }],
        destination: "https://thelongevitysummit.eu/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
