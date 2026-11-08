/** Result of a scan at a room's door (zala/actions.ts). Kept apart from the actions file, which may only export functions. */
export type RoomState = {
  status: "idle" | "ok" | "already" | "not_booked" | "no_ticket" | "full" | "clash" | "error" | "pick";
  code?: string;
  name?: string;
  tierName?: string;
  /** ISO time of the earlier arrival, on "already". */
  at?: string;
  /** Where the person is booked at this hour instead, on "not_booked". */
  elsewhere?: string | null;
  /** Free places in this room, on "not_booked" - whether a walk-in is possible. */
  left?: number;
  message?: string;
  /** At a partner stand: which of the ticket's slots there was marked. */
  slot?: string;
  /** On "pick": a phone or a name matched several tickets; the stand chooses one. */
  candidates?: { code: string; name: string; tierName: string }[];
  /** Changes on every scan so two identical scans in a row both register. */
  scannedAt?: number;
};

export const initialRoomState: RoomState = { status: "idle" };
