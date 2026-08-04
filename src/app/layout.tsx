import type { Metadata } from "next";
import { Unbounded, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const displayFont = Unbounded({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800"],
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin", "cyrillic"],
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
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bh-ink text-white">{children}</body>
    </html>
  );
}
