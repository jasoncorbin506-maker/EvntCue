import { getMilestones, type MilestoneWithStatus } from "@/data/event-milestones";
import type { CategoryKey } from "@/data/budget-presets";

export type RailPinState = "today" | "gate" | "dayof" | "travel" | "past" | "default";

export type RailPinBodyItem = {
  ico: string;
  t: string;
  d: string;
};

export type RailPin = {
  id: string;
  when: string; // "May 17"
  label: string;
  sub: string | null;
  state: RailPinState;
  body: RailPinBodyItem[];
};

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
});

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_PER_MONTH = 30.44;

const GATE_KEYWORDS = [
  "save-the-dates",
  "save the date",
  "counseling",
  "pre-cana",
  "paperwork",
  "license",
  "permit",
  "registration",
  "rsvp",
  "guest count",
  "invitations",
];

const TRAVEL_KEYWORDS = [
  "hotel",
  "travel",
  "rehearsal",
];

function classify(label: string, leadMonths: number, isPast: boolean): RailPinState {
  if (isPast) return "past";
  if (leadMonths === 0) return "dayof";
  const lower = label.toLowerCase();
  if (TRAVEL_KEYWORDS.some((k) => lower.includes(k))) return "travel";
  if (GATE_KEYWORDS.some((k) => lower.includes(k))) return "gate";
  return "default";
}

function pickIcon(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes("save")) return "send";
  if (lower.includes("counsel") || lower.includes("cana")) return "heart";
  if (lower.includes("vendor")) return "users";
  if (lower.includes("invitation")) return "send";
  if (lower.includes("guest count") || lower.includes("rsvp")) return "users";
  if (lower.includes("rehearsal")) return "plate";
  if (lower.includes("hotel") || lower.includes("travel")) return "plane";
  if (lower.includes("ceremony") || lower.includes("wedding")) return "heart";
  if (lower.includes("reception") || lower.includes("banquet") || lower.includes("dinner")) return "plate";
  if (lower.includes("cake") || lower.includes("tasting")) return "plate";
  if (lower.includes("photo") || lower.includes("shoot")) return "camera";
  if (lower.includes("paperwork") || lower.includes("license")) return "note";
  return "note";
}

export function buildRailPins(args: {
  category: CategoryKey;
  subtypeKey: string | null;
  startDateIso: string;
  now?: Date;
}): RailPin[] {
  const now = args.now ?? new Date();
  // Strip to midnight for stable comparisons
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(args.startDateIso + "T00:00:00");
  const monthsUntil = Math.max(0, (start.getTime() - today.getTime()) / (MS_PER_DAY * DAYS_PER_MONTH));

  const milestones: MilestoneWithStatus[] = getMilestones(
    args.category,
    args.subtypeKey,
    monthsUntil,
  );

  // Build pins as {pin, date} pairs, then sort chronologically so Today
  // sits between past milestones and future ones rather than always at index 0.
  type RailPinWithDate = { pin: RailPin; date: Date };
  const items: RailPinWithDate[] = [];

  items.push({
    pin: {
      id: "today",
      when: SHORT_DATE.format(today),
      label: "Today",
      sub: "Where you are right now",
      state: "today",
      body: [
        {
          ico: "pulse",
          t: "Right now",
          d: "You’re looking at your dashboard. <em>It’s about time.</em>",
        },
      ],
    },
    date: today,
  });

  const used = new Set<string>(["today"]);

  for (let i = 0; i < milestones.length; i++) {
    const m = milestones[i];
    const milestoneDate =
      m.lead === 0
        ? start
        : new Date(start.getTime() - m.lead * DAYS_PER_MONTH * MS_PER_DAY);
    const isPast = milestoneDate < today;
    const state = classify(m.label, m.lead, isPast);

    let id = `m-${i}-${m.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    if (used.has(id)) id = `${id}-${i}`;
    used.add(id);

    items.push({
      pin: {
        id,
        when: SHORT_DATE.format(milestoneDate),
        label: m.label,
        sub: m.detail ?? null,
        state,
        body: [
          {
            ico: pickIcon(m.label),
            t: m.label,
            d: m.detail ?? "",
          },
        ],
      },
      date: milestoneDate,
    });
  }

  // Stable sort by date — past milestones first, then today, then future, then day-of last.
  items.sort((a, b) => a.date.getTime() - b.date.getTime());
  return items.map((item) => item.pin);
}

export function formatPinLongDate(pin: RailPin, refIso: string): string {
  // Reconstruct date from `when` and ref year for the drawer header. Falls back to the ref iso.
  // For simplicity we just render pin.when; long date is not strictly needed in 3.2.A.
  void refIso;
  return pin.when;
}

export function formatStartLongDate(startDateIso: string): string {
  return LONG_DATE.format(new Date(startDateIso + "T00:00:00"));
}
