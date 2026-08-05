"use server";

import { headers } from "next/headers";

import { checkRateLimit } from "@/lib/rate-limit";
import type { SignupState } from "@/lib/signup-state";
import { createSignup, signupSchema } from "@/lib/signups";

/**
 * Server Actions are reachable by direct POST, not just through our form, so
 * everything here is validated as untrusted input: honeypot, throttle, schema.
 */
export async function submitSignup(
  _prev: SignupState,
  formData: FormData,
): Promise<SignupState> {
  // Bots fill every field they find; humans never see this one.
  if (typeof formData.get("company") === "string" && formData.get("company")) {
    return { status: "success" };
  }

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip).allowed) {
    return {
      status: "error",
      message: "Твърде много опити. Опитай пак след минута.",
    };
  }

  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") ?? undefined,
    interestedTier: formData.get("interestedTier") || undefined,
    consent: formData.get("consent") === "on",
    source: formData.get("source") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: SignupState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "email" || field === "name" || field === "consent") {
        fieldErrors[field] ??= issue.message;
      }
    }

    return {
      status: "error",
      message: "Провери отбелязаните полета.",
      fieldErrors,
    };
  }

  try {
    await createSignup(parsed.data);
  } catch (error) {
    // Detail stays server-side; the visitor gets nothing that describes the
    // database or confirms whether an address is already on the list.
    console.error("signup failed", error);
    return {
      status: "error",
      message: "Нещо се обърка. Опитай пак или пиши на hello@biohacking.bg.",
    };
  }

  return {
    status: "success",
    message: "Готово! Ще ти пишем, щом ранните билети тръгнат.",
  };
}
