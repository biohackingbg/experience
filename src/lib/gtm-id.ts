import "server-only";

/**
 * The container id, in one place - read at request time, like the
 * measurement id, so connecting or swapping a container is a setting and a
 * refresh, not a setting and a rebuild.
 */
export const gtmId = () => {
  const value = process.env.GTM_CONTAINER_ID?.trim();
  return value && /^GTM-[A-Z0-9]+$/i.test(value) ? value : null;
};

/** The name the browser side looks for. */
export const GTM_ID_GLOBAL = "__slsGtmId";
