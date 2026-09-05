/**
 * The lists you can write to. Client-safe on purpose: the compose form runs
 * in the browser and needs the same names the sender uses.
 */
export type Audience = "signups" | "buyers" | "waitlist";

export const AUDIENCES: { id: Audience; label: string; note: string }[] = [
  { id: "signups", label: "Списъкът", note: "хората, които се записаха за новини на сайта" },
  { id: "buyers", label: "Купувачите", note: "всеки с платен билет - за важни новини преди събитието" },
  { id: "waitlist", label: "Чакащите", note: "оставили имейл за изчерпано ниво" },
];

export const isAudience = (v: unknown): v is Audience => AUDIENCES.some((a) => a.id === v);
