"use server";

import { cookies } from "next/headers";
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
