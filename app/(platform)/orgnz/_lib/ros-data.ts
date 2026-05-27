/**
 * Run-of-Show static blocks for v1 Day-of mode demo.
 *
 * Stubbed array — no DB representation yet (PARKING_LOT #23). When a Run-of-Show
 * table or extension to event_milestones lands (Phase 4+ or its own schema
 * decision), swap this for a server-fetched list keyed off event_id.
 *
 * Per Jason 2026-05-10: build day-of UI with mocked data so the demo lands;
 * wire real data in Phase 4+/5+ (PARKING_LOT #24).
 */

export type RosBlockState = "done" | "live" | "next" | "";

export type RosBlock = {
  time: string;
  title: string;
  vendor: string;
  state: RosBlockState;
};

export const ROS_BLOCKS: RosBlock[] = [
  { time: "11:00 AM", title: "Vndr load-in window opens", vendor: "All Vndrs · north entrance", state: "done" },
  { time: "12:30 PM", title: "Bridal party arrives · suite open", vendor: "Brighton · Tom holds the key", state: "done" },
  { time: "1:00 PM", title: "Hair & makeup begins", vendor: "Bridal suite · 4 stylists", state: "done" },
  { time: "2:15 PM", title: "Hayes Studio arrives · getting-ready coverage", vendor: "Hayes · photo + video", state: "done" },
  { time: "3:00 PM", title: "Father Diaz arrives · final pre-ceremony", vendor: "Saint Mary’s · officiant", state: "done" },
  { time: "3:30 PM", title: "Guests begin seating", vendor: "Ushers · program handout", state: "done" },
  { time: "4:00 PM", title: "Ceremony · processional begins", vendor: "Brighton chapel · DJ Reyes audio", state: "done" },
  { time: "4:35 PM", title: "Ceremony ends · receiving line", vendor: "Family + bridal party", state: "done" },
  { time: "4:45 PM", title: "Cocktail hour · garden terrace", vendor: "DJ Reyes ambient · bar opens", state: "live" },
  { time: "5:30 PM", title: "Family + bridal party photos", vendor: "Hayes Studio · Brighton lawn", state: "next" },
  { time: "6:00 PM", title: "Reception · doors open · grand entrance", vendor: "DJ Reyes · MC kicks off", state: "" },
  { time: "6:15 PM", title: "First dance", vendor: "DJ Reyes · “At Last” (locked)", state: "" },
  { time: "6:30 PM", title: "Toasts · Padrino · Maid of Honor · Best Man", vendor: "Open mic · 3 toasts · 12 min", state: "" },
  { time: "7:00 PM", title: "Dinner service begins", vendor: "Maison Levi · 175 plates", state: "" },
  { time: "8:15 PM", title: "Cake cutting", vendor: "The Sugar Atelier", state: "" },
  { time: "8:30 PM", title: "Open dancing", vendor: "DJ Reyes · full set", state: "" },
  { time: "10:30 PM", title: "Send-off · sparklers + getaway car", vendor: "Bridal party · all guests", state: "" },
  { time: "11:30 PM", title: "Hard stop · Venu cleanup begins", vendor: "Brighton + all Vndrs", state: "" },
];

export const ROS_NOW = {
  eyebrow: "Right now · live",
  title: "Cocktail hour · garden terrace",
  detail: "DJ Reyes · ambient set",
};

export const ROS_HEAD_LABEL = "Run of Show · Sept 14";
