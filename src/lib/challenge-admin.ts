import "server-only";

import { pushConfigured } from "@/lib/push";

/** What the admin page needs, re-exported in one place so the page imports one module. */
export { PHASES, WEEK_TARGET, checkinsByDay, dateOfDay, dayNumber, listChallenges, listParticipants } from "@/lib/challenge";

export const pushConfiguredForAdmin = () => pushConfigured();
