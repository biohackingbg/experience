import "server-only";

import { NextResponse } from "next/server";

import { type AppUser, authFromRequest } from "@/lib/app-auth";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * The small vocabulary every /api/v1 route speaks: JSON in, JSON out, a
 * bearer token for anything personal, and one error shape the app can
 * show without guessing.
 */

export const json = (data: unknown, status = 200, headers?: HeadersInit) => NextResponse.json(data, { status, headers });
export const fail = (status: number, error: string, extra?: Record<string, unknown>) => json({ error, ...(extra ?? {}) }, status);

export async function readBody<T = Record<string, unknown>>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export const ipOf = (request: Request) => request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

export const langOf = (v: unknown): "bg" | "en" => (v === "en" ? "en" : "bg");

/** Throttle by caller address; `max` per minute. */
export function limited(request: Request, bucket: string, max: number): boolean {
  return !checkRateLimit(`v1:${bucket}:${ipOf(request)}`, max).allowed;
}

/** Either the signed-in user or the 401 to send back. */
export async function requireUser(request: Request): Promise<{ user: AppUser } | { response: NextResponse }> {
  const user = await authFromRequest(request);
  if (!user) return { response: fail(401, "unauthorized") };
  return { user };
}

/** Public reads are cached a little at the edge: the programme does not change by the second. */
export const publicCache = { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" };
