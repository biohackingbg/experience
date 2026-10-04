import { json, publicCache } from "@/lib/api-v1";
import { listPublicPartners } from "@/lib/partner-profiles";

export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/api-v1";

/** The partners whose profiles are public: name, logo, a few lines, their stands. Nothing from the deal. */
export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "bg";
  const partners = await listPublicPartners(lang);
  return json({ partners }, 200, publicCache);
}
