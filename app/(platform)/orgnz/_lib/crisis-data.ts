/**
 * 12-Minute Bump static demo data.
 *
 * Per Jason 2026-05-10 (PARKING_LOT #24): vendor on-site status, ETAs,
 * booked-Plnr presence, RSVPs are all stubbed for v1. Real data wires in
 * Phase 4+/5+. Hardcoded names + statuses below match the v2 mockup.
 */

export type VendorStatus = "ok" | "late" | "unknown";

export type CrisisVendor = {
  name: string;
  role: string;
  status: VendorStatus;
};

export const CRISIS_VENDORS: CrisisVendor[] = [
  { name: "Hayes Studio (Photo)", role: "Arrived 2:15 · setting up", status: "ok" },
  { name: "Bloomsmith (Florals)", role: "ETA was 2:00 · 1h 42m late", status: "late" },
  { name: "Saint Mary’s (Officiant)", role: "Father Diaz arrived 3:00", status: "ok" },
  { name: "Brighton Abbey (Venu)", role: "House manager: Tom · on call", status: "ok" },
];

export type QuickAction = {
  iconPath: string;
  title: string;
  detail: string;
  toast: string;
};

export const CRISIS_QUICK_ACTIONS: QuickAction[] = [
  {
    iconPath: "M21 11.5a8.4 8.4 0 01-9 8.5 8.6 8.6 0 01-3.5-.7L3 21l1.7-5A8.4 8.4 0 1121 11.5z",
    title: "Text all guests",
    detail: "Delay update · 175 contacts",
    toast: "Texting all <em>175 guests</em>: ceremony delayed 15 min.",
  },
  {
    iconPath: "M12 7v5l3 2M16 3l5 5",
    title: "Push timeline +15",
    detail: "Cascade to all Vndrs",
    toast: "<em>Pushed</em> next milestone +15 min. Vndrs notified.",
  },
  {
    iconPath: "M12 21s-7-7-7-12a7 7 0 0114 0c0 5-7 12-7 12z",
    title: "Copy Venu address",
    detail: "For lost guests / Vndrs",
    toast: "Address copied. <em>Brighton Abbey, Argyle TX</em>",
  },
  {
    iconPath: "M3 21a9 9 0 0118 0",
    title: "Page your Plnr",
    detail: "Eliana · 24/7 day-of",
    toast: "<em>Eliana</em> is on her way. ETA 4 min.",
  },
];

export type MomentAction = {
  iconPath: string;
  title: string;
  detail: string;
  toast: string;
};

export const MOMENT_ACTIONS: MomentAction[] = [
  {
    iconPath: "M5 4h4l2 5-3 2a11 11 0 005 5l2-3 5 2v4a2 2 0 01-2 2A18 18 0 013 6a2 2 0 012-2z",
    title: "Page your Plnr",
    detail: "Eliana · always reachable",
    toast: "Calling <em>Eliana</em> · your Plnr · 24/7 day-of…",
  },
  {
    iconPath: "M3 19a6 6 0 0112 0M14 19a4 4 0 017-2.5",
    title: "Page your person",
    detail: "Maid of Honor · Mom · Padrino",
    toast: "Texting <em>Maid of Honor</em>: come find her.",
  },
  {
    iconPath: "M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6",
    title: "Hold the suite",
    detail: "Privacy · 5 · 10 · 20 min",
    toast: "Bridal suite secured. <em>Door held by Tom.</em>",
  },
  {
    iconPath: "M10 8v8M14 8v8",
    title: "Hold the show",
    detail: "Quiet pause · no announcement",
    toast: "<em>Pause acknowledged.</em> Vndrs will hold position.",
  },
];

export const SHIFT_OPTIONS = [5, 15, 30, 60] as const;
export const DEFAULT_SHIFT = 15;

export type ShiftBlock = {
  title: string;
  detail: string;
};

export const SHIFT_BLOCKS: ShiftBlock[] = [
  { title: "Ceremony start", detail: "Currently 4:00 PM · 14 min from now" },
  { title: "Dinner service", detail: "Currently 7:00 PM · Maison Levi alerted" },
];
