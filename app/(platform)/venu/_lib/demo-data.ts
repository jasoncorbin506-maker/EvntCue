/**
 * Stub demo data for chunk B. Pre-launch the test venue tenant has no real
 * inquiries / bookings / events, so the visual port runs against this
 * fixture set until real reads wire in a later chunk.
 *
 * Shapes mirror the canonical DB schema (booking_inquiries / bookings /
 * events) plus the new seven-state lifecycle enum from master spec v27.1
 * Lock 4 + 5b. The DB enum migration (003 currently has the old enum) is
 * queued separately — see PARKING_LOT.
 *
 * Replace this module wholesale when real reads land; the page-side code
 * accepts the same shape.
 */

import type { InquiryStatus } from "@/lib/labels/inquiry-status";

export type DemoInquiry = {
  id: string;
  eventName: string;
  eventDate: string; // ISO YYYY-MM-DD
  guestCount: number;
  budgetCents: number;
  status: InquiryStatus;
  hoursSinceCreated: number;
  /** Qualification badges — short strings the venue surfaces at-a-glance. */
  badges: string[];
};

export const DEMO_INQUIRIES: DemoInquiry[] = [
  {
    id: "INQ-9182",
    eventName: "Patel × Singh wedding",
    eventDate: "2026-09-12",
    guestCount: 280,
    budgetCents: 12_500_000,
    status: "inquiry",
    hoursSinceCreated: 4,
    badges: ["Date open", "Within capacity"],
  },
  {
    id: "INQ-9180",
    eventName: "Acme Q3 conference",
    eventDate: "2026-07-22",
    guestCount: 180,
    budgetCents: 8_400_000,
    status: "reviewing",
    hoursSinceCreated: 18,
    badges: ["Repeat client", "Mid-week"],
  },
  {
    id: "INQ-9176",
    eventName: "Reynolds 50th",
    eventDate: "2026-06-08",
    guestCount: 90,
    budgetCents: 3_200_000,
    status: "quoted",
    hoursSinceCreated: 30,
    badges: ["Quote sent · 14 May"],
  },
  {
    id: "INQ-9171",
    eventName: "Chen wedding",
    eventDate: "2026-08-30",
    guestCount: 220,
    budgetCents: 9_800_000,
    status: "penciled",
    hoursSinceCreated: 60,
    badges: ["Hold · expires 22 May"],
  },
  {
    id: "INQ-9164",
    eventName: "Vasquez quinceañera",
    eventDate: "2026-05-31",
    guestCount: 150,
    budgetCents: 4_500_000,
    status: "inked",
    hoursSinceCreated: 96,
    badges: ["Deposit received"],
  },
  {
    id: "INQ-9152",
    eventName: "Brigham nonprofit gala",
    eventDate: "2026-04-04",
    guestCount: 200,
    budgetCents: 6_800_000,
    status: "closed",
    hoursSinceCreated: 720,
    badges: ["Booked · completed"],
  },
];

/** Lock-doc segment groupings. */
export type InquirySegment = "new" | "quoted" | "held" | "closed";

export function segmentFor(status: InquiryStatus): InquirySegment {
  switch (status) {
    case "inquiry":
    case "reviewing":
      return "new";
    case "quoted":
      return "quoted";
    case "penciled":
    case "inked":
      return "held";
    case "booked":
    case "closed":
      return "closed";
  }
}

export const SEGMENT_LABELS: Record<InquirySegment, string> = {
  new: "New",
  quoted: "Quoted",
  held: "Held",
  closed: "Closed",
};

/* ─────────────────────────── BOOKINGS ─────────────────────────── */

export type DemoBooking = {
  eventId: string;
  eventName: string;
  eventDate: string; // ISO YYYY-MM-DD
  startTime: string; // "5:30 PM"
  guestCount: number;
  spaceLabel: string;
  netRevenueCents: number;
  status: "confirmed" | "tentative" | "completed";
};

export const DEMO_BOOKINGS: DemoBooking[] = [
  {
    eventId: "EVT-04827",
    eventName: "Hartwell wedding",
    eventDate: "2026-05-17", // today (matches the eyeball date)
    startTime: "5:30 PM",
    guestCount: 140,
    spaceLabel: "Grand Ballroom",
    netRevenueCents: 1_184_000,
    status: "confirmed",
  },
  {
    eventId: "EVT-04831",
    eventName: "Okafor Q2 offsite",
    eventDate: "2026-05-21",
    startTime: "9:00 AM",
    guestCount: 60,
    spaceLabel: "Lantern Loft",
    netRevenueCents: 480_000,
    status: "confirmed",
  },
  {
    eventId: "EVT-04822",
    eventName: "Mendoza milestone birthday",
    eventDate: "2026-05-24",
    startTime: "7:00 PM",
    guestCount: 80,
    spaceLabel: "Garden Terrace",
    netRevenueCents: 620_000,
    status: "confirmed",
  },
  {
    eventId: "EVT-04836",
    eventName: "Patel × Singh sangeet",
    eventDate: "2026-05-29",
    startTime: "6:00 PM",
    guestCount: 220,
    spaceLabel: "Grand Ballroom",
    netRevenueCents: 1_640_000,
    status: "tentative",
  },
];

/* Group bookings by Today / This week / Rest of month. */
export type BookingGroup = {
  key: "today" | "thisWeek" | "restOfMonth";
  label: string;
  rows: DemoBooking[];
};

export function groupBookings(bookings: DemoBooking[], today: Date = new Date()): BookingGroup[] {
  const todayIso = today.toISOString().slice(0, 10);
  const endOfThisWeek = new Date(today);
  // "This week" = up to next Sunday inclusive.
  const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
  endOfThisWeek.setDate(today.getDate() + daysUntilSunday);
  const endOfWeekIso = endOfThisWeek.toISOString().slice(0, 10);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const endOfMonthIso = endOfMonth.toISOString().slice(0, 10);

  const todayRows: DemoBooking[] = [];
  const weekRows: DemoBooking[] = [];
  const monthRows: DemoBooking[] = [];

  for (const b of bookings) {
    if (b.eventDate === todayIso) todayRows.push(b);
    else if (b.eventDate > todayIso && b.eventDate <= endOfWeekIso) weekRows.push(b);
    else if (b.eventDate > endOfWeekIso && b.eventDate <= endOfMonthIso) monthRows.push(b);
  }

  return [
    { key: "today", label: "Today", rows: todayRows },
    { key: "thisWeek", label: "This week", rows: weekRows },
    { key: "restOfMonth", label: "Rest of month", rows: monthRows },
  ];
}

/* ─────────────────────────── EVENT DETAIL ─────────────────────────── */

export type DemoEventDetail = {
  eventId: string;
  name: string;
  status: "confirmed" | "tentative" | "completed";
  statusLabel: string; // "Confirmed · Date locked" etc.
  eventDate: string;
  startTime: string;
  guestCount: number;
  spaceLabel: string;
  netRevenueCents: number;
  actions: EventActionRowData[];
};

export type EventActionRowData = {
  key: string;
  name: string;
  sub: string;
  /** "done" | "todo" | undefined → render no badge */
  state?: "done" | "todo";
  statusLabel?: string;
  iconPath: string;
};

/**
 * Stub for /venu/bookings/[event_id]. Per the spine-of-the-platform principle
 * (Operating Ritual decision #9), everything event_id-scoped lives inside
 * this view. The mockup's Screen 2 defines the six action rows.
 */
export function getDemoEventDetail(eventId: string): DemoEventDetail | null {
  // For chunk B we only have the canonical Hartwell stub; other event_ids
  // fall through. Real reads in a later chunk replace this lookup.
  if (eventId === "EVT-04827" || eventId === "demo") {
    return HARTWELL_EVENT;
  }
  // Hand back the same stub data with the requested ID so any booking row
  // tap renders coherently in the eyeball.
  return { ...HARTWELL_EVENT, eventId };
}

const HARTWELL_EVENT: DemoEventDetail = {
  eventId: "EVT-04827",
  name: "The Hartwell wedding",
  status: "confirmed",
  statusLabel: "Confirmed · Date locked",
  eventDate: "2026-05-17",
  startTime: "5:30 PM",
  guestCount: 140,
  spaceLabel: "Grand Ballroom",
  netRevenueCents: 1_184_000,
  actions: [
    {
      key: "beo",
      name: "BEO acknowledgment",
      sub: "Sign off on the banquet event order",
      state: "todo",
      statusLabel: "Pending",
      iconPath:
        "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M14 3v6h6 M9 13h6 M9 17h6",
    },
    {
      key: "seat",
      name: "Seat chart",
      sub: "14 tables · 140 seats · shared with Orgnz",
      state: "done",
      statusLabel: "Ready",
      iconPath:
        "M4 4h16v16H4z M8 9 h0 M12 9 h0 M16 9 h0 M8 13 h0 M12 13 h0 M16 13 h0 M8 17 h0 M12 17 h0 M16 17 h0",
    },
    {
      key: "timeline",
      name: "Timeline",
      sub: "5:30 ceremony · 6:15 cocktails · 7:30 dinner",
      state: "done",
      statusLabel: "Signed",
      iconPath: "M12 7v5l3 2 M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0",
    },
    {
      key: "vendors",
      name: "Vendor roster",
      sub: "4 confirmed · 1 awaiting COI",
      state: "todo",
      statusLabel: "1 open",
      iconPath:
        "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M5 7a4 4 0 0 1 8 0 a4 4 0 0 1 -8 0 M22 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.7",
    },
    {
      key: "money",
      name: "Money for this event",
      sub: "Rental · F&B · referral fees · platform fee",
      state: "done",
      statusLabel: "$11,840 net",
      iconPath: "M12 4v16 M7 8h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8",
    },
    {
      key: "messages",
      name: "Messages with the Orgnz",
      sub: "Last reply: 2 days ago",
      iconPath:
        "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z",
    },
  ],
};

/* ─────────────────────────── FORMATTERS ─────────────────────────── */

export function formatUSDCents(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    // Trim cents for >$1k display.
    return `$${dollars.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `$${dollars.toFixed(2)}`;
}

export function formatEventDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`); // noon-anchor avoids TZ flip
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
