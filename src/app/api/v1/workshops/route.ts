import { json } from "@/lib/api-v1";
import { BOOKING_OPENS_AT, bookingOpen, listWorkshops } from "@/lib/workshops";

export const dynamic = "force-dynamic";
export { OPTIONS } from "@/lib/api-v1";

/**
 * A session that has ended is gone from the list: during the summit both the
 * iPhone app and the web app kept showing the morning's sessions all day, and
 * neither can tell the time of a slot by itself. Running sessions stay until
 * their end. A bonus has no hours and always stays.
 */
function notOver(w: { day: number; startsAt: string; endsAt: string }): boolean {
  if (!w.endsAt) return true;
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(new Date());
  const today = date < "2026-11-07" ? 0 : date === "2026-11-07" ? 1 : date === "2026-11-08" ? 2 : 3;
  if (w.day !== today) return w.day > today;
  const now = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Sofia", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  return w.endsAt > now;
}

/**
 * Every open workshop with how many places are left - never cached, seats
 * move. `bookingOpensAt` says when booking opens; until then a booking is
 * refused with the reason "not_open".
 */
export async function GET(request: Request) {
  const open = bookingOpen();
  // The iPhone app that is in the App Store was built before "opens at" existed: it draws a Запази button
  // on every row and answers a refused booking with "Опитай пак". Until booking opens it is sent an empty
  // list, which it words itself ("Записването отваря скоро. Ще пратим известие…"). A browser (the web app,
  // which does read bookingOpen) always gets the list so people can look at what is coming.
  const fromBrowser = /Mozilla/i.test(request.headers.get("user-agent") ?? "");
  // The app shipped before the bonus kind knows only workshop and experience;
  // anything else it would label a workshop. Rules stay on the server.
  const workshops = (open || fromBrowser ? await listWorkshops() : [])
    .filter(notOver)
    .map((w) => (w.kind === "bonus" ? { ...w, kind: "experience" as const } : w));
  return json({ workshops, bookingOpen: open, bookingOpensAt: BOOKING_OPENS_AT.toISOString() }, 200, { "Cache-Control": "no-store" });
}
