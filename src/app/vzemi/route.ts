/** A short address to type from a message: thelongevitysummit.eu/vzemi. */
export function GET(request: Request) {
  const url = new URL(request.url);
  return Response.redirect(new URL(`/bilet/vzemi${url.search}`, url), 302);
}
