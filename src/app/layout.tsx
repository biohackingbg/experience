import type { Metadata } from "next";
import { Sofia_Sans, Geologica, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ViewTracker } from "@/components/ViewTracker";
import { cheapestOf, getPricing, priceOf } from "@/lib/pricing";
import { MetaPixel } from "@/components/MetaPixel";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { GoogleTagManager } from "@/components/GoogleTagManager";
import { ConsentBanner } from "@/components/ConsentBanner";
import { pixelId } from "@/lib/meta-pixel";
import { GA_ID_GLOBAL, gaId } from "@/lib/ga-id";
import { GTM_ID_GLOBAL, gtmId } from "@/lib/gtm-id";
import { META } from "@/lib/site-copy";
import { formatPrice } from "@/lib/tickets";

/** Both faces carry Cyrillic, so Bulgarian headings no longer fall back. */
const bodyFont = Geologica({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
});

const displayFont = Sofia_Sans({
  variable: "--font-display-sans",
  subsets: ["latin", "cyrillic"],
});

const monoFont = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE = "https://thelongevitysummit.eu";
const TITLE = META.bg.title;
const describe = (from: number) => META.bg.describe(formatPrice(from));

/**
 * Generated rather than declared: the description quotes the cheapest ticket,
 * and a constant would keep advertising the launch price in search results
 * after the early window has closed.
 */
export async function generateMetadata(): Promise<Metadata> {
  const pricing = await getPricing();
  const DESCRIPTION = describe(priceOf(pricing, cheapestOf(pricing)));
  return {
  // Makes the generated OG image resolve to an absolute URL, which every
  // social crawler requires.
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  // Both languages are declared to search engines, so the English page is
  // found as the English version rather than as a near-duplicate.
  alternates: { canonical: "/", languages: { bg: "/", en: "/en" } },
  // Proves ownership to Search Console without touching DNS. The domain sits
  // on SuperHosting's redirect nameservers, which serve a template zone with
  // no TXT records, so the DNS method is not available until the zone moves.
  // The token is meant to be public - it grants nothing on its own.
  verification: { google: "k4X2UcEpwd0cQmdN6bpoZEPUi2zl3UHdxap635lbmUM" },
  openGraph: {
    type: "website",
    locale: "bg_BG",
    url: SITE,
    siteName: "Sofia Life Summit",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bg"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${monoFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bh-frame p-2 text-bh-ink sm:p-3">
        {/* Runs before first paint: marks scripting as available (so the
            scroll-reveal styles only hide what they can un-hide) and applies
            the saved theme, avoiding a flash of the wrong one. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;try{var t=localStorage.getItem('bh-theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}d.dataset.theme=t}catch(e){d.dataset.theme='light'}d.classList.add('js')})()`,
          }}
        />
        {/* Google Consent Mode's default, set before anything Google could
            run - which on this site is nothing at all until a visitor grants
            it, so there is no ambiguous window for `wait_for_update` to
            cover. Runs on every visit, whatever the choice ends up being:
            Consent Mode has to see a denied default before it can see the
            update rememberConsent sends once there is a real choice.
            `gtag` is a plain dataLayer-pusher here, not the analytics script
            - that only loads once consent is actually granted. */}
        {gaId() || gtmId() ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});`,
            }}
          />
        ) : null}
        <ViewTracker />
        {children}
        {/* Even after an id is connected, nothing loads until the visitor
            makes an explicit marketing choice - and the banner that asks for
            it appears as soon as any tag is connected. */}
        {gaId() ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.${GA_ID_GLOBAL}=${JSON.stringify(gaId())}`,
            }}
          />
        ) : null}
        {gtmId() ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.${GTM_ID_GLOBAL}=${JSON.stringify(gtmId())}`,
            }}
          />
        ) : null}
        <MetaPixel id={pixelId()} />
        <GoogleAnalytics />
        <GoogleTagManager />
        <ConsentBanner enabled={Boolean(pixelId() || gaId() || gtmId())} />
      </body>
    </html>
  );
}
