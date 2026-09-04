"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { checkRateLimit } from "@/lib/rate-limit";
import { setAttendeeName } from "@/lib/tickets-lookup";
import { bookPlace, cancelPlace } from "@/lib/workshops";

export type AttendeeState = { status: "idle" | "ok" | "error"; message?: string };

export type BookingState = { status: "idle" | "ok" | "error"; message?: string };

const BOOK_ERROR: Record<string, { bg: string; en: string }> = {
  no_ticket: { bg: "Билетът не е намерен.", en: "Ticket not found." },
  not_found: { bg: "Сесията не е намерена.", en: "Session not found." },
  closed: { bg: "Записването за тази сесия е затворено.", en: "Booking for this session is closed." },
  not_allowed: { bg: "Не е включено в твоя билет.", en: "Not included in your ticket." },
  full: { bg: "Местата свършиха, докато избираше.", en: "The places ran out while you were choosing." },
  clash: { bg: "В този час вече си записан другаде.", en: "You are already booked elsewhere at this time." },
  already: { bg: "Вече си записан за тази сесия.", en: "You are already booked for this session." },
};

/**
 * Booking a place from the ticket page. The code in the URL is the key, so
 * the same throttle as the page applies; every rule is settled server-side
 * in workshops.ts, and the button only ever asks.
 */
export async function bookWorkshop(_prev: BookingState, formData: FormData): Promise<BookingState> {
  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`book:${ip}`, 40).allowed) return { status: "error", message: "Твърде много опити. Опитай след малко." };

  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const workshopId = String(formData.get("workshopId") ?? "");
  const lang = formData.get("lang") === "en" ? "en" : "bg";
  if (!/^[0-9a-f-]{36}$/.test(workshopId)) return { status: "error", message: BOOK_ERROR.not_found[lang] };

  if (formData.get("cancel") === "1") {
    const ok = await cancelPlace(code, workshopId);
    revalidatePath(`/bilet/${code}`);
    return ok ? { status: "ok" } : { status: "error", message: BOOK_ERROR.not_found[lang] };
  }

  const r = await bookPlace(code, workshopId);
  revalidatePath(`/bilet/${code}`);
  return r.ok ? { status: "ok" } : { status: "error", message: BOOK_ERROR[r.reason][lang] };
}

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
