/**
 * Guests sheet demo data — paid-tier preview.
 *
 * Per PARKING_LOT #19 (closed 2026-05-11 to full-tile gate): free-tier users
 * never reach this surface. Sheet renders for paid tier only. Real RSVP / guest
 * list data wires in Phase 4+/5+; these placeholders match the v2 mockup so the
 * paywall preview reads true.
 */

export type RecentRsvp = {
  name: string;
  answer: "yes" | "no";
  meta: string;
  when: string;
};

export const RECENT_RSVPS: RecentRsvp[] = [
  { name: "Aunt Margarita Reyes", answer: "yes", meta: "+1 · vegetarian", when: "2h ago" },
  { name: "Carlos & Beatriz Mendoza", answer: "yes", meta: "+2 (kids)", when: "5h ago" },
  { name: "Jamie Hartfield", answer: "no", meta: "sent regrets card", when: "yesterday" },
];

export type TravelStat = {
  label: string;
  value: string;
  detail: string;
};

export const TRAVEL_STATS: TravelStat[] = [
  { label: "Out of town", value: "38", detail: "guests" },
  { label: "Flying in", value: "21", detail: "to DFW" },
  { label: "Need rides", value: "9", detail: "from venue" },
];

export type TravelRow = {
  iconPath: string;
  title: string;
  detail: string;
};

export const TRAVEL_ROWS: TravelRow[] = [
  {
    iconPath: "M3 21h18M5 21V8h14v13M9 21v-6h6v6M9 11h.01M14 11h.01",
    title: "Hotel block",
    detail: "Marriott Las Colinas · 15 rooms · 12 sent · 8 booked",
  },
  {
    iconPath: "M2 12l8-1L14 4l3 1-2 7 7 3-1 3-8-2-3 6-3-1 1-7-7-3 1-3z",
    title: "Air travel",
    detail: "21 flying in · DFW · 9 sent · 4 booked",
  },
  {
    iconPath: "M3 8h18v10H3zM7 18a2 2 0 100 4 2 2 0 000-4zM17 18a2 2 0 100 4 2 2 0 000-4zM3 12h18",
    title: "Group transport",
    detail: "Shuttle from hotel block · 9 guests need rides",
  },
  {
    iconPath: "M5 7h14l-1 13H6L5 7zM9 7V5a3 3 0 016 0v2",
    title: "Welcome bags",
    detail: "Drop list · 38 rooms · Sept 13",
  },
];

export const RSVP_HERO = {
  inCount: 73,
  total: 175,
  pendingCount: 102,
  weeksLeft: 6,
};
