"use server";

import { redirect } from "next/navigation";

import { confirmEarlyAccess } from "@/lib/surveys";

export async function confirm(token: string): Promise<void> {
  const r = await confirmEarlyAccess(token);
  redirect(`/ranen-dostap/${token}?ok=${r === "missing" ? "0" : "1"}`);
}
