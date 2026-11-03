import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * The web-app manifest for one ticket. Installing the page from the ticket
 * puts an icon on the home screen that opens straight on that ticket - which
 * is why the manifest is per code rather than one for the site. Nothing here
 * is secret: the code is already in the address the browser asked for.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params;
  const code = decodeURIComponent(kod).trim().toUpperCase();
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return new NextResponse("Not found", { status: 404 });

  return NextResponse.json(
    {
      name: "Sofia Life Summit",
      short_name: "SLS билет",
      description: "Твоят билет за Sofia Life Summit 2026",
      id: `/bilet/${code}`,
      start_url: `/bilet/${code}`,
      scope: "/bilet/",
      display: "standalone",
      background_color: "#02251f",
      theme_color: "#02251f",
      icons: [
        { src: "/icons/app-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icons/app-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icons/app-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "content-type": "application/manifest+json", "cache-control": "public, max-age=3600" } },
  );
}
