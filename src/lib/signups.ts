import "server-only";

import { z } from "zod";

import { CONSENT_TEXT, CONSENT_VERSION, TIERS } from "./consent";
import { getDb } from "./db";
import { signups } from "./db/schema";

export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "Въведи валиден имейл адрес." }))
    .pipe(z.string().max(254)),
  name: z
    .string()
    .trim()
    .max(120, { message: "Името е твърде дълго." })
    .optional()
    .or(z.literal("").transform(() => undefined)),
  interestedTier: z.enum(TIERS).optional(),
  consent: z.literal(true, {
    message: "Трябва да се съгласиш, за да те уведомим.",
  }),
  source: z.string().trim().max(60).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;

/**
 * Writes the signup. Re-submitting a known address is treated as success and
 * leaves the original consent record untouched — that keeps the endpoint from
 * doubling as a way to check whether someone is on the list.
 */
export async function createSignup(input: SignupInput): Promise<void> {
  const db = getDb();

  await db
    .insert(signups)
    .values({
      email: input.email,
      name: input.name,
      interestedTier: input.interestedTier,
      consented: true,
      consentAt: new Date(),
      consentText: `${CONSENT_VERSION}: ${CONSENT_TEXT}`,
      source: input.source,
    })
    .onConflictDoNothing({ target: signups.email });
}
