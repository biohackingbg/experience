import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SpeakerPage } from "@/components/summit/SpeakerPage";
import { SPEAKER_PAGE } from "@/lib/site-copy";
import { getSpeakerPage } from "@/lib/speakers-data";

export const revalidate = 300;

const SITE = "https://thelongevitysummit.eu";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getSpeakerPage(id);
  if (!data) return { title: "Лектор | Sofia Life Summit" };
  const s = data.speaker;
  const who = [s.title, s.name].filter(Boolean).join(" ");
  const what = [s.specialty, [s.role, s.affiliation].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
  const description = SPEAKER_PAGE.bg.describe(who, what);
  return {
    title: `${who} | Sofia Life Summit 2026`,
    description,
    alternates: { canonical: `/lektor/${id}`, languages: { bg: `/lektor/${id}`, en: `/en/lektor/${id}` } },
    openGraph: {
      type: "profile",
      url: `${SITE}/lektor/${id}`,
      title: `${who} | Sofia Life Summit 2026`,
      description,
      images: [{ url: `${SITE}/api/lektor-karta/${id}?size=landscape`, width: 1200, height: 627 }],
    },
    twitter: { card: "summary_large_image", title: who, description },
  };
}

/**
 * A speaker's own address - what someone finds when they search the person's
 * name, and what the speaker has to share.
 */
export default async function SpeakerRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(id)) notFound();
  const data = await getSpeakerPage(id);
  if (!data) notFound();

  const s = data.speaker;
  // Google reads the person as a person, and the event they belong to.
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: s.name,
    jobTitle: [s.role, s.specialty].filter(Boolean).join(", ") || undefined,
    affiliation: s.affiliation ? { "@type": "Organization", name: s.affiliation } : undefined,
    image: s.photo ? `${SITE}${s.photo}` : undefined,
    url: `${SITE}/lektor/${id}`,
    sameAs: [data.links.website, data.links.linkedin, data.links.instagram].filter(Boolean),
    performerIn: {
      "@type": "Event",
      name: "Sofia Life Summit 2026",
      startDate: "2026-11-07T09:00:00+02:00",
      url: SITE,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SpeakerPage data={data} />
    </>
  );
}
