/**
 * Shape of the signup action's result.
 *
 * Lives outside the `"use server"` module on purpose: such a file may only
 * export async functions, so the initial-state object cannot sit next to the
 * action itself.
 */
export type SignupState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"email" | "name" | "consent", string>>;
};

export const initialSignupState: SignupState = { status: "idle" };
