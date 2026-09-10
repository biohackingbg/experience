import "server-only";

/**
 * The measurement id, in one place.
 *
 * Read at request time and handed to the browser in the page, rather than
 * baked into the scripts at build: connecting an account is then a setting
 * and a refresh, not a setting and a rebuild that whoever pasted the id has
 * no way to know is needed.
 */
export const gaId = () => {
  const value = process.env.GA_MEASUREMENT_ID?.trim();
  return value && /^G-[A-Z0-9]+$/i.test(value) ? value : null;
};

/** The name the browser side looks for. */
export const GA_ID_GLOBAL = "__slsGaId";
