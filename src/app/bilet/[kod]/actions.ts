"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { chooseArrival } from "@/lib/arrivals";
import { checkRateLimit } from "@/lib/rate-limit";
import { changeTicketDay } from "@/lib/ticket-day";
import { sendHandoverEmail } from "@/lib/email";
import { getTier } from "@/lib/tickets";
import { setAttendee } from "@/lib/tickets-lookup";
import { BOOKING } from "@/lib/i18n";
import { bookPlace, bookingOpensLabel, cancelPlace } from "@/lib/workshops";

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
  if (r.ok) return { status: "ok" };
  if (r.reason === "not_open") return { status: "error", message: BOOKING[lang].opensNote(bookingOpensLabel(lang)) };
  return { status: "error", message: BOOK_ERROR[r.reason][lang] };
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
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const en = formData.get("lang") === "en";
  if (name.length > 80) return { status: "error", message: en ? "The name is too long." : "Името е твърде дълго." };
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { status: "error", message: en ? "That email address does not look right." : "Имейлът не изглежда верен." };
  if (email && !name) return { status: "error", message: en ? "Add the person's name too." : "Напиши и името на човека." };

  const r = await setAttendee(code, name, email || null);
  if (r.r === "not_found") return { status: "error", message: en ? "Ticket not found." : "Билетът не е намерен." };
  if (r.r === "used") return { status: "error", message: en ? "The ticket was already used and cannot change hands." : "Билетът вече е използван и не може да се променя." };

  revalidatePath(`/bilet/${code}`);
  // A new holder gets the ticket and the way into the app, once per address.
  const holder = email && email !== r.buyerEmail.toLowerCase() ? email : null;
  if (holder && holder !== r.before?.toLowerCase()) {
    const ok = await sendHandoverEmail({ to: holder, holderName: name, buyerName: r.buyerName, code, tierName: getTier(r.tierId)?.name ?? r.tierId, lang: r.lang === "en" ? "en" : "bg" });
    if (!ok) return { status: "error", message: en ? `Saved, but the email to ${holder} did not go. Try again in a moment.` : `Записано, но писмото до ${holder} не тръгна. Опитай пак след малко.` };
    return { status: "ok", message: en ? `Saved. The ticket went to ${holder}: they sign in to the app with that address.` : `Записано. Билетът е изпратен на ${holder}: с този имейл влиза в приложението.` };
  }
  return { status: "ok", message: name ? (en ? `Saved: ${name}.` : `Записано: ${name}.`) : en ? "Cleared." : "Името е изчистено." };
}

export type ArrivalState = { status: "idle" | "ok" | "error"; message?: string };

const ARRIVAL_ERROR: Record<string, { bg: string; en: string }> = {
  off: { bg: "Изборът на час още не е отворен.", en: "Picking a time is not open yet." },
  not_found: { bg: "Билетът не е намерен.", en: "Ticket not found." },
  used: { bg: "Билетът вече е използван на входа.", en: "The ticket was already used at the door." },
  wrong_day: { bg: "Този билет не важи за този ден.", en: "This ticket is not valid for that day." },
  bad_slot: { bg: "Няма такъв час.", en: "No such time." },
  full: { bg: "Този час се запълни, докато избираше. Вземи друг.", en: "That time filled up while you were choosing. Pick another." },
};

/** The holder picks an arrival window for one day; every rule is settled in arrivals.ts. */
export async function chooseArrivalSlot(_prev: ArrivalState, formData: FormData): Promise<ArrivalState> {
  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`arrival:${ip}`, 40).allowed) return { status: "error", message: "Твърде много опити. Опитай след малко." };
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const day = Number(formData.get("day"));
  const slot = String(formData.get("slot") ?? "");
  const lang = formData.get("lang") === "en" ? "en" : "bg";
  if (day !== 1 && day !== 2) return { status: "error", message: ARRIVAL_ERROR.wrong_day[lang] };
  const r = await chooseArrival(code, day, slot);
  revalidatePath(`/bilet/${code}`);
  return r.ok ? { status: "ok" } : { status: "error", message: ARRIVAL_ERROR[r.reason][lang] };
}

export type DayState = { status: "idle" | "ok" | "error"; message?: string };

const DAY_ERROR: Record<string, { bg: string; en: string }> = {
  not_found: { bg: "Билетът не е намерен.", en: "Ticket not found." },
  used: { bg: "Билетът вече е използван на входа.", en: "The ticket was already used at the door." },
  not_pickable: { bg: "Този билет важи за двата дни.", en: "This ticket is valid for both days." },
  closed: { bg: "Изборът на ден е затворен.", en: "Choosing a day is closed." },
};

/** The holder of a one-day ticket picks or changes its day; the rules live in ticket-day.ts. */
export async function chooseTicketDay(_prev: DayState, formData: FormData): Promise<DayState> {
  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const lang = formData.get("lang") === "en" ? "en" : "bg";
  if (!checkRateLimit(`day:${ip}`, 20).allowed) return { status: "error", message: lang === "en" ? "Too many attempts. Try again shortly." : "Твърде много опити. Опитай след малко." };
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const day = Number(formData.get("day"));
  if (day !== 1 && day !== 2) return { status: "error", message: lang === "en" ? "Pick Saturday or Sunday." : "Избери събота или неделя." };
  const r = await changeTicketDay(code, day);
  revalidatePath(`/bilet/${code}`);
  if (!r.ok) return { status: "error", message: DAY_ERROR[r.reason][lang] };
  return { status: "ok", message: r.droppedBookings > 0 ? (lang === "en" ? "Your workshop bookings for the other day were released." : "Записаните workshops за другия ден са освободени.") : undefined };
}
