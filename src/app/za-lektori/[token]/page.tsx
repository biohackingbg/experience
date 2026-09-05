import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BANNERS } from "@/lib/banner-presets";
import { kitUrl, readKitToken, shareLinks, suggestedPosts } from "@/lib/speaker-kit";
import { listSpeakers } from "@/lib/speakers-data";

import { CopyBox } from "./CopyBox";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Материали за лектори | Sofia Life Summit",
  robots: { index: false, follow: false },
};

/**
 * One page per speaker, on a private link: their own tracked links, the
 * banners, and two posts already written with their name in them. The point
 * is that sharing costs a speaker one tap and costs us nothing - and that we
 * can see afterwards whose audience actually came.
 */
export default async function SpeakerKitPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const id = readKitToken(decodeURIComponent(token));
  if (!id) notFound();

  const speaker = (await listSpeakers()).find((s) => s.id === id);
  if (!speaker) notFound();

  const links = shareLinks(speaker.id);
  const linksEn = shareLinks(speaker.id, "en");
  const posts = suggestedPosts(speaker.name, speaker.topic ?? speaker.specialty ?? null);
  const postsEn = suggestedPosts(speaker.name, speaker.topicEn ?? speaker.specialtyEn ?? null, "en");
  const images = BANNERS.filter((b) => ["ig-square", "ig-portrait", "ig-story", "linkedin-cover", "og"].includes(b.id));

  return (
    <div className="min-h-screen bg-bh-paper px-5 py-12 text-bh-ink sm:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-bh-ink/50">Sofia Life Summit · 07-08 ноември 2026</p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          Материали за {speaker.title ? `${speaker.title} ` : ""}{speaker.name}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-bh-ink/70">
          Тази страница е само за теб. Вътре са връзките, които водят към сайта и показват, че хората
          идват от твоята публикация, готови текстове и картинки в размерите на всяка мрежа. Ако
          споделиш едно нещо, нека е връзката - по нея виждаме кой колко души е довел.
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-bold tracking-tight">Твоите връзки</h2>
          <p className="mt-1 text-sm text-bh-ink/60">
            Използвай връзката за мрежата, в която публикуваш. Води към началната страница.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {links.map((l) => (
              <CopyBox key={l.id} label={l.label} value={l.url} />
            ))}
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-bh-ink/70">Същите връзки към английската страница</summary>
            <div className="mt-3 flex flex-col gap-3">
              {linksEn.map((l) => (
                <CopyBox key={l.id} label={`${l.label} · English`} value={l.url} />
              ))}
            </div>
          </details>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold tracking-tight">Готови текстове</h2>
          <p className="mt-1 text-sm text-bh-ink/60">Вземи ги както са или ги промени - по-добре е с твои думи.</p>
          <div className="mt-4 flex flex-col gap-3">
            {posts.map((p) => (
              <CopyBox key={p.title} label={p.title} value={p.text} multiline />
            ))}
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-bh-ink/70">На английски</summary>
            <div className="mt-3 flex flex-col gap-3">
              {postsEn.map((p) => (
                <CopyBox key={p.title} label={p.title} value={p.text} multiline />
              ))}
            </div>
          </details>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold tracking-tight">Картинки</h2>
          <p className="mt-1 text-sm text-bh-ink/60">Всяка е в размера на своята мрежа, за да не се реже.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {images.map((b) => (
              <li key={b.id} className="flex flex-col rounded-2xl bg-bh-cloud p-3 ring-1 ring-bh-ink/8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/banner/${b.id}`}
                  alt=""
                  className="w-full rounded-xl bg-[#02251f] object-contain"
                  style={{ aspectRatio: `${b.width} / ${b.height}`, maxHeight: 160 }}
                />
                <a
                  href={`/api/banner/${b.id}`}
                  download={`sofia-life-summit-${b.id}.png`}
                  className="mt-3 inline-flex w-fit rounded-full border border-bh-ink/20 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-bh-ink"
                >
                  Свали
                </a>
              </li>
            ))}
          </ul>
          {speaker.hasPhoto && (
            <p className="mt-4 text-sm text-bh-ink/60">
              Снимката ти, както излиза на сайта:{" "}
              <a href={`/api/lektor/${speaker.id}`} className="underline" download={`${speaker.id}.jpg`}>
                свали я оттук
              </a>
              . Ако искаш друга, прати ни я и я сменяме.
            </p>
          )}
        </section>

        <section className="mt-10 rounded-3xl bg-bh-cloud p-6 ring-1 ring-bh-ink/8">
          <h2 className="text-lg font-bold tracking-tight">Ако имаш време за три неща</h2>
          <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-bh-ink/75">
            <li>Една публикация с твоята връзка - когато ти е удобно.</li>
            <li>Кратко видео от телефона, 40 секунди: кой си и на какъв въпрос отговаряш на сцената.</li>
            <li>Едно стори в седмицата преди събитието, 5-6 ноември.</li>
          </ol>
          <p className="mt-4 text-sm text-bh-ink/60">
            Въпроси и материали: <a href="mailto:hi@biohacking.bg" className="underline">hi@biohacking.bg</a>
          </p>
        </section>

        <p className="mt-10 font-mono text-[0.65rem] uppercase tracking-[0.15em] text-bh-ink/40">
          Личната ти връзка към тази страница: {kitUrl(speaker.id)}
        </p>
      </div>
    </div>
  );
}
