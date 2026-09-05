"use server";

import { headers } from "next/headers";

import { requestEmailLink } from "@/lib/access";
import { checkRateLimit } from "@/lib/rate-limit";

export type RequestState = { status: "idle" | "sent" | "error"; message?: string };

/**
 * The answer never says whether an address has access: it is the same either
 * way, so this page cannot be used to find out who is on the team.
 */
export async function requestAccess(_prev: RequestState, formData: FormData): Promise<RequestState> {
  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`dostap:${ip}`, 10).allowed) {
    return { status: "error", message: "Твърде много опити. Пробвай пак след минута." };
  }
  const email = String(formData.get("email") ?? "").trim();
  await requestEmailLink(email);
  return {
    status: "sent",
    message: "Ако този адрес има достъп, връзката вече пътува към него. Важи 30 минути - провери и в спам.",
  };
}
