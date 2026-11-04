import { APP_STORE_URL, WEB_APP_URL } from "@/lib/app-links";

export const dynamic = "force-dynamic";

/** One link for the app: iPhone and iPad to the App Store, every other phone and computer to the web version. */
export function GET(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  const apple = /iPhone|iPad|iPod/i.test(ua);
  return Response.redirect(apple ? APP_STORE_URL : WEB_APP_URL, 302);
}
