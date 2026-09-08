import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SpeakerPage } from "@/components/summit/SpeakerPage";
import { SPEAKER_PAGE } from "@/lib/site-copy";
import { getSpeakerPage } from "@/lib/speakers-data";

export const revalidate = 300;

const SITE = "https://thelongevitysummit.eu";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getSpeakerPage(id, "en");
  if (!data) return { title: "Speaker | Sofia Life Summit" };
  const s = data.speaker;
  const who = [s.title, s.name].filter(Boolean).join(" ");
  const what = [s.specialty, [s.role, s.affiliation].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
  const description = SPEAKER_PAGE.en.describe(who, what);
  return {
    title: `${who} | Sofia Life Summit 2026`,
    description,
    alternates: { canonical: `/en/lektor/${id}`, languages: { bg: `/lektor/${id}`, en: `/en/lektor/${id}` } },
    openGraph: {
      type: "profile",
      url: `${SITE}/en/lektor/${id}`,
      title: `${who} | Sofia Life Summit 2026`,
      description,
      images: [{ url: `${SITE}/api/lektor-karta/${id}?size=landscape&lang=en`, width: 1200, height: 627 }],
    },
    twitter: { card: "summary_large_image", title: who, description },
  };
}

export default async function SpeakerRouteEn({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(id)) notFound();
  const data = await getSpeakerPage(id, "en");
  if (!data) notFound();
  return <SpeakerPage data={data} lang="en" />;
}
