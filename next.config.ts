import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp carries a native binary and must be required at runtime rather
  // than bundled into the route that resizes the speaker portraits.
  serverExternalPackages: ["sharp"],
  // Speaker portraits are uploaded through a server action; they are resized
  // in the browser first, so the ceiling is generous, not large.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // The site embeds nowhere; the admin panel especially must not be
          // frameable. CSP frame-ancestors is the modern header, X-Frame-
          // Options covers older engines.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Camera stays available to this origin: the door scanner on
          // /admin/vhod reads QR codes with it.
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        // Both hostnames were serving the site with a 200, so every page
        // existed at two addresses at once. The canonical tag told Google
        // which one counts, but a redirect settles it for everything else -
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
