/**
 * Result of a door scan.
 *
 * `scannedAt` exists so two identical scans in a row still register as separate
 * events on the client - without it, React sees an unchanged object and the
 * screen would not flash for the second one.
 */
export type ScanState = {
  status: "idle" | "ok" | "used" | "invalid" | "error";
  code?: string;
  name?: string;
  tierName?: string;
  /** 1 = Saturday, 2 = Sunday - what the door has to check on a one-day ticket. */
  day?: number | null;
  usedAt?: string;
  /** On a second scan the whole ticket, so the door can check the person and let them back in. */
  ticket?: {
    holder: string;
    holderEmail: string | null;
    buyerName: string;
    reference: string;
    bookings: string[];
  };
  message?: string;
  scannedAt?: number;
};

export const initialScanState: ScanState = { status: "idle" };
