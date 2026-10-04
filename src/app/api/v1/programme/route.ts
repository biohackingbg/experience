import { json, langOf, publicCache } from "@/lib/api-v1";
import { getProgram } from "@/lib/program-data";

export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/api-v1";

export async function GET(request: Request) {
  const lang = langOf(new URL(request.url).searchParams.get("lang"));
  const days = await getProgram(lang);
  return json({ lang, days }, 200, publicCache);
}
