import type { Metadata } from "next";
import { Sofia_Sans, Geologica, Geist_Mono } from "next/font/google";
import "./globals.css";

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
const TITLE = "Sofia Life Summit 2026 | Biohacking Experience, София";
const DESCRIPTION =
  "Sofia Life Summit — 07–08 ноември 2026, Гранд Хотел Милениум, София. Четири зони, longevity паспорт, 12 станции за измерване и билети от 50 €.";

export const metadata: Metadata = {
  // Makes the generated OG image resolve to an absolute URL, which every
  // social crawler requires.
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  // Proves ownership to Search Console without touching DNS. The domain sits
  // on SuperHosting's redirect nameservers, which serve a template zone with
  // no TXT records, so the DNS method is not available until the zone moves.
  // The token is meant to be public — it grants nothing on its own.
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
        {children}
      </body>
    </html>
  );
}
