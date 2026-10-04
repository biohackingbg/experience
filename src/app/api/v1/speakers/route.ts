import { json, langOf, publicCache } from "@/lib/api-v1";
import { getAnnouncedSpeakers } from "@/lib/speakers-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const lang = langOf(new URL(request.url).searchParams.get("lang"));
  const speakers = await getAnnouncedSpeakers(lang);
  return json({ lang, speakers }, 200, publicCache);
}
