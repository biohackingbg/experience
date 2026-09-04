/**
 * Shape of the checkout action's result.
 *
 * Outside the `"use server"` module because such a file may only export async
 * functions - the same constraint the signup action ran into.
 */
export type CheckoutField =
  | "tierId"
  | "quantity"
  | "promo"
  | "name"
  | "email"
  | "phone"
  | "terms";

export type CheckoutState = {
  status: "idle" | "error" | "redirect";
  message?: string;
  fieldErrors?: Partial<Record<CheckoutField, string>>;
  /**
   * Stripe's hosted checkout URL. Returned rather than issued as a server-side
   * redirect: `redirect()` from a Server Action is handled by the client
   * router, which does not leave the app for an external origin - the POST
   * succeeded and the order was created, but the browser stayed put.
   */
  redirectUrl?: string;
};

export const initialCheckoutState: CheckoutState = { status: "idle" };
