"use server";

import { checkRateLimit } from "@/lib/rate-limit";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_COOKIE,
  checkPassword,
  createSessionToken,
  isConfigured,
  sessionCookieOptions,
} from "@/lib/admin-auth";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // Says so plainly rather than rejecting a correct password as wrong.
  if (!isConfigured()) {
    return {
      error:
        "Достъпът не е настроен на сървъра (липсват ADMIN_PASSWORD или ADMIN_SESSION_SECRET).",
    };
  }

  // The only thing between the internet and every buyer's data is this one
  // password, so guessing gets throttled per address. Same vague error as a
  // wrong password: a limiter that says "slow down" confirms the endpoint.
  const head = await headers();
  const ip = head.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`login:${ip}`).allowed) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Грешна парола." };
  }

  const password = String(formData.get("password") ?? "");

  if (!checkPassword(password)) {
    // Deliberately vague, and slow enough to make guessing tedious.
    await new Promise((r) => setTimeout(r, 600));
    return { error: "Грешна парола." };
  }

  const token = createSessionToken();
  if (!token) return { error: "Неуспешно създаване на сесия." };

  const store = await cookies();
  store.set(ADMIN_COOKIE, token, sessionCookieOptions);
  redirect("/admin");
}

export async function logout() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
