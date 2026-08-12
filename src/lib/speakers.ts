/**
 * Speakers.
 *
 * Confirmed people only — an unconfirmed name on a page that sells tickets is
 * a promise the event may not keep. Slots that are still being booked are
 * rendered as honest "announcing soon" cards rather than filled with guesses.
 *
 * `photo` is a path under /public. Until a portrait arrives, the card falls
 * back to a monogram, which reads as deliberate rather than broken.
 */
export type Speaker = {
  id: string;
  /** Prefix shown above the name: "Проф. д-р", "Dr.", "PhD" … */
  title?: string;
  name: string;
  /** Medical or research speciality — the credential that matters most here. */
  specialty?: string;
  /** Country of practice, shown as a small label. */
  country?: string;
  /** Hospital, university or company. */
  affiliation?: string;
  /** What they speak about at the summit. */
  topic?: string;
  photo?: string;
  /** Set while the slot is still being confirmed. */
  pending?: boolean;
};

export const SPEAKERS: Speaker[] = [
  {
    id: "rayna-stoyanova",
    title: "Д-р",
    name: "Райна Стоянова",
    specialty: "Ендокринолог",
    country: "България",
    photo: "/speakers/rayna-stoyanova.jpg",
  },
  { id: "tba-1", name: "Обявява се скоро", pending: true },
  { id: "tba-2", name: "Обявява се скоро", pending: true },
  { id: "tba-3", name: "Обявява се скоро", pending: true },
  { id: "tba-4", name: "Обявява се скоро", pending: true },
  { id: "tba-5", name: "Обявява се скоро", pending: true },
];

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => /\p{L}/u.test(part))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
