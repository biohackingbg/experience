"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { checkRateLimit } from "@/lib/rate-limit";
import { setAttendeeName } from "@/lib/tickets-lookup";

export type AttendeeState = { status: "idle" | "ok" | "error"; message?: string };

/**
 * The buyer names who will use the ticket. The code is the only key, as
 * for the page itself, so the same throttle applies - a guessed code must
 * not be able to rename tickets at machine speed.
 */
export async function saveAttendee(_prev: AttendeeState, formData: FormData): Promise<AttendeeState> {
  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`attendee:${ip}`).allowed) {
    return { status: "error", message: "Твърде много опити. Опитай след малко." };
  }

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length > 80) return { status: "error", message: "Името е твърде дълго." };

  const r = await setAttendeeName(code, name);
  if (r === "not_found") return { status: "error", message: "Билетът не е намерен." };
  if (r === "used") return { status: "error", message: "Билетът вече е използван и името не може да се променя." };

  revalidatePath(`/bilet/${code}`);
  return { status: "ok", message: name ? `Записано: ${name}.` : "Името е изчистено." };
}
