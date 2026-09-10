/**
 * The measurement id, in one place.
 *
 * It is public by nature - it sits in the page for anyone to read - so the
 * same setting serves the browser tag and the server-side purchase, and
 * connecting an account is one variable rather than two that can disagree.
 */
export const gaId = () => {
  const value = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return value && /^G-[A-Z0-9]+$/i.test(value) ? value : null;
};
