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
  title: "Biohacking Experience 2026 | Sofia Life Summit",
  description:
    "Потребителската част на Sofia Life Summit — 07–08 ноември 2026, Гранд Хотел Милениум, София. Четири зони, longevity паспорт, 12 станции за измерване и билети от 50 €.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bg"
      className={`${bodyFont.variable} ${monoFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bh-ink p-2 text-bh-ink sm:p-3">
        {/* Marks scripting as available before first paint, so the scroll-reveal
            styles only hide content when they can also un-hide it. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js')`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
