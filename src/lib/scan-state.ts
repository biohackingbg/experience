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
  usedAt?: string;
  message?: string;
  scannedAt?: number;
};

export const initialScanState: ScanState = { status: "idle" };
