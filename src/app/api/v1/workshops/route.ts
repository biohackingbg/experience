import { json } from "@/lib/api-v1";
import { listWorkshops } from "@/lib/workshops";

export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/api-v1";

/** Every open workshop with how many places are left - never cached, seats move. */
export async function GET() {
  const workshops = await listWorkshops();
  return json({ workshops }, 200, { "Cache-Control": "no-store" });
}
