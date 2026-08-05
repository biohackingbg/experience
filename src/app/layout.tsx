import type { Metadata } from "next";
import { Inter, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
});

const displayFont = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

const monoFont = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Longevity Summit 2026 | Biohacking Experience, София",
  description:
    "Longevity Summit — 07–08 ноември 2026, Гранд Хотел Милениум, София. Четири зони, longevity паспорт, 12 станции за измерване и билети от 50 €.",
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
